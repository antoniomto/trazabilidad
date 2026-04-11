import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { prisma } from '../config/db'

const router = Router()
router.use(requireAuth)

// Products — todos los roles pueden leer (operario necesita esto para crear lotes)
router.get('/products', async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { phaseTemplates: { orderBy: { orderIndex: 'asc' } } },
  })
  res.json(products)
})

// Raw materials — todos los roles pueden leer
router.get('/raw-materials', async (_req: Request, res: Response) => {
  const materials = await prisma.rawMaterial.findMany({ where: { active: true } })
  res.json(materials)
})

// Users — solo admin
router.get('/users', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })
  res.json(users)
})

export default router
