import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/db'
import { env } from '../config/env'

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active) throw new Error('Credenciales inválidas')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('Credenciales inválidas')

  const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: '15m',
  })
  const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' })

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string }
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.active) throw new Error('Usuario no encontrado')

  const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: '15m',
  })
  return { accessToken }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}
