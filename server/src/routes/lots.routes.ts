import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'
import { LotCreateSchema, LotReleaseSchema } from '@trazabilidad/shared'
import { createLot, getLots, getLotDetail, releaseLot } from '../services/lot.service'

const router = Router()

router.use(requireAuth)

router.get('/', async (req: Request, res: Response) => {
  try {
    const lots = await getLots({
      status: req.query.status as string | undefined,
      productId: req.query.productId as string | undefined,
    })
    res.json(lots)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener lotes' })
  }
})

router.post('/', validate(LotCreateSchema), async (req: Request, res: Response) => {
  try {
    const lot = await createLot(req.body, req.user!.userId)
    res.status(201).json(lot)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lot = await getLotDetail(req.params.id)
    if (!lot) return res.status(404).json({ error: 'Lote no encontrado' })
    res.json(lot)
  } catch {
    res.status(500).json({ error: 'Error al obtener lote' })
  }
})

router.patch(
  '/:id/release',
  requireRole('SUPERVISOR', 'ADMIN'),
  validate(LotReleaseSchema),
  async (req: Request, res: Response) => {
    try {
      const lot = await releaseLot(req.params.id, req.user!.userId, req.body.notes)
      res.json(lot)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
)

export default router
