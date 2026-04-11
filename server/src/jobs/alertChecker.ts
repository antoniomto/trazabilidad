// NOTE: This cron job is single-instance only.
// If you scale to multiple server instances, migrate this to pg_cron or a dedicated worker.
import cron from 'node-cron'
import { prisma } from '../config/db'
import { broadcastAlert } from '../utils/sse'
import { logger } from '../lib/logger'

export function startAlertChecker() {
  // Run every 60 seconds to check for overdue phases
  cron.schedule('*/60 * * * * *', async () => {
    try {
      const overdueThresholdMinutes = 120

      const overduePhases = await prisma.productionPhase.findMany({
        where: {
          status: 'IN_PROGRESS',
          startedAt: {
            lt: new Date(Date.now() - overdueThresholdMinutes * 60 * 1000),
          },
        },
        include: { lot: { select: { id: true, lotNumber: true } } },
      })

      for (const phase of overduePhases) {
        // Check if we already have an active overdue alert for this phase
        const existing = await prisma.alert.findFirst({
          where: { phaseId: phase.id, type: 'PHASE_OVERDUE', status: 'ACTIVE' },
        })
        if (existing) continue

        const alert = await prisma.alert.create({
          data: {
            lotId: phase.lotId,
            phaseId: phase.id,
            type: 'PHASE_OVERDUE',
            severity: 'WARNING',
            message: `Fase "${phase.name}" lleva más de ${overdueThresholdMinutes} minutos en progreso en lote ${phase.lot.lotNumber}`,
            status: 'ACTIVE',
          },
        })

        broadcastAlert(alert)
        logger.warn({ phaseId: phase.id }, 'Alerta de fase vencida generada')
      }
    } catch (err) {
      logger.error({ err }, 'Error en alert checker')
    }
  })

  logger.info('✅ Alert checker iniciado (cada 60s)')
}
