import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { PhaseParamSchema, PhaseCompleteSchema } from '@trazabilidad/shared'
import { startPhase, savePhaseParameters, completePhase } from '../services/phase.service'

const router = Router()
router.use(requireAuth)

router.patch('/:id/start', async (req: Request, res: Response) => {
  try {
    const phase = await startPhase(req.params.id, req.user!.userId)
    res.json(phase)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/:id/parameters', validate(PhaseParamSchema), async (req: Request, res: Response) => {
  try {
    const result = await savePhaseParameters(
      req.params.id,
      req.body.parameters,
      req.body.mermaKg,
      req.body.notes,
      req.user!.userId
    )
    res.status(201).json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.patch(
  '/:id/complete',
  validate(PhaseCompleteSchema),
  async (req: Request, res: Response) => {
    try {
      const phase = await completePhase(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        req.body.qualityApproved,
        req.body.qualityNote,
        req.body.notes
      )
      res.json(phase)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
)

export default router
