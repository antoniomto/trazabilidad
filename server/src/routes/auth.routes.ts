import { Router, Request, Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import { validate } from '../middleware/validate.middleware'
import { requireAuth } from '../middleware/auth.middleware'
import { loginUser, refreshAccessToken } from '../services/auth.service'
import { prisma } from '../config/db'
import { LoginSchema } from '@trazabilidad/shared'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Intente nuevamente en 15 minutos.' },
})

router.post('/login', loginLimiter, validate(LoginSchema), async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken, user } = await loginUser(req.body.email, req.body.password)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.json({ accessToken, user })
  } catch {
    res.status(401).json({ error: 'Credenciales inválidas' })
  }
})

router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'No hay sesión activa' })
  try {
    const { accessToken } = await refreshAccessToken(token)
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Sesión expirada' })
  }
})

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken')
  res.json({ ok: true })
})

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true },
  })
  res.json(user)
})

export default router
