import { prisma } from '../config/db'
import { broadcastAlert } from '../utils/sse'
import { logger } from '../lib/logger'

interface ExpectedParam {
  key: string
  unit: string
  min?: number
  max?: number
}

export async function evaluateAndCreateAlerts(
  phaseId: string,
  lotId: string,
  parameters: Array<{ id: string; key: string; value: number; unit: string }>,
  expectedParams: ExpectedParam[]
) {
  const alerts = []

  for (const param of parameters) {
    const expected = expectedParams.find((e) => e.key === param.key)
    if (!expected) continue

    const isOutOfRange =
      (expected.min !== undefined && param.value < expected.min) ||
      (expected.max !== undefined && param.value > expected.max)

    if (isOutOfRange) {
      await prisma.phaseParameter.update({
        where: { id: param.id },
        data: { isOutOfRange: true },
      })

      const rangeDesc =
        expected.min !== undefined && expected.max !== undefined
          ? `rango: ${expected.min}–${expected.max} ${expected.unit}`
          : expected.max !== undefined
          ? `máximo: ${expected.max} ${expected.unit}`
          : `mínimo: ${expected.min} ${expected.unit}`

      const alert = await prisma.alert.create({
        data: {
          lotId,
          phaseId,
          parameterId: param.id,
          type: 'PARAMETER_OUT_OF_RANGE',
          severity: 'CRITICAL',
          message: `⚠️ ${param.key.replace(/_/g, ' ')}: ${param.value} ${param.unit} fuera de rango (${rangeDesc})`,
          status: 'ACTIVE',
        },
      })

      alerts.push(alert)
      logger.warn({ alert }, 'Alerta de parámetro fuera de rango generada')
      broadcastAlert(alert)
    }
  }

  return alerts
}

export async function getActiveAlerts() {
  return prisma.alert.findMany({
    where: { status: 'ACTIVE' },
    include: {
      lot: { select: { lotNumber: true, product: { select: { name: true } } } },
      phase: { select: { name: true } },
    },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  })
}
