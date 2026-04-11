import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'
import { AlertAcknowledgeSchema } from '@trazabilidad/shared'
import { prisma } from '../config/db'
import { addSSEClient } from '../utils/sse'
import { v4 as uuidv4 } from 'uuid'
import { getActiveAlerts } from '../services/alert.service'

const router = Router()
router.use(requireAuth)

// SSE stream
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const clientId = uuidv4()
  addSSEClient(clientId, req.user!.userId, res)

  // Send current active alert count immediately
  getActiveAlerts().then((alerts) => {
    if (!res.writableEnded) {
      res.write(`event: init\ndata: ${JSON.stringify({ count: alerts.length })}\n\n`)
    }
  })
})

router.get('/', async (req: Request, res: Response) => {
  const alerts = await prisma.alert.findMany({
    where: {
      ...(req.query.status && { status: req.query.status as any }),
      ...(req.query.lotId && { lotId: req.query.lotId as string }),
    },
    include: {
      lot: { select: { lotNumber: true, product: { select: { name: true } } } },
      phase: { select: { name: true } },
      acknowledgedBy: { select: { name: true } },
    },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  })
  res.json(alerts)
})

router.get('/active/count', async (_req: Request, res: Response) => {
  const count = await prisma.alert.count({ where: { status: 'ACTIVE' } })
  res.json({ count })
})

router.patch(
  '/:id/acknowledge',
  requireRole('SUPERVISOR', 'ADMIN'),
  validate(AlertAcknowledgeSchema),
  async (req: Request, res: Response) => {
    try {
      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedById: req.user!.userId,
          acknowledgedAt: new Date(),
          acknowledgeNote: req.body.acknowledgeNote,
        },
      })
      res.json(alert)
    } catch {
      res.status(404).json({ error: 'Alerta no encontrada' })
    }
  }
)

export default router
