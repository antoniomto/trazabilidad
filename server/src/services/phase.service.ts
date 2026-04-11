import { prisma } from '../config/db'
import { evaluateAndCreateAlerts } from './alert.service'

interface ParamInput {
  key: string
  value: number
  unit: string
  notes?: string
}

export async function startPhase(phaseId: string, operatorId: string) {
  const phase = await prisma.productionPhase.findUniqueOrThrow({ where: { id: phaseId } })

  // Update lot status to IN_PROGRESS if still OPEN
  await prisma.lot.updateMany({
    where: { id: phase.lotId, status: 'OPEN' },
    data: { status: 'IN_PROGRESS' },
  })

  return prisma.productionPhase.update({
    where: { id: phaseId },
    data: { status: 'IN_PROGRESS', startedAt: new Date(), operatorId },
  })
}

export async function savePhaseParameters(
  phaseId: string,
  params: ParamInput[],
  mermaKg: number | undefined,
  notes: string | undefined,
  userId: string
) {
  const phase = await prisma.productionPhase.findUniqueOrThrow({
    where: { id: phaseId },
    include: { template: true },
  })

  // Create phase parameters
  const createdParams = await Promise.all(
    params.map((p) =>
      prisma.phaseParameter.create({
        data: {
          phaseId,
          key: p.key,
          value: p.value,
          unit: p.unit,
          recordedById: userId,
          notes: p.notes,
        },
      })
    )
  )

  // Update merma and notes on phase
  await prisma.productionPhase.update({
    where: { id: phaseId },
    data: {
      ...(mermaKg !== undefined && { mermaKg }),
      ...(notes && { notes }),
    },
  })

  // Evaluate alerts against expected params from template
  const expectedParams = (phase.template?.expectedParams as any[]) ?? []
  const paramsList = createdParams.map((p, i) => ({
    id: p.id,
    key: p.key,
    value: params[i].value,
    unit: p.unit,
  }))

  const alerts = await evaluateAndCreateAlerts(phaseId, phase.lotId, paramsList, expectedParams)

  return { parameters: createdParams, alerts }
}

export async function completePhase(
  phaseId: string,
  completedById: string,
  completedByRole: string,
  qualityApproved?: boolean,
  qualityNote?: string,
  notes?: string
) {
  const phase = await prisma.productionPhase.findUniqueOrThrow({
    where: { id: phaseId },
    select: { lotId: true },
  })

  const isSupervisor = completedByRole === 'SUPERVISOR' || completedByRole === 'ADMIN'

  const completed = await prisma.productionPhase.update({
    where: { id: phaseId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      // supervisorId sólo se registra cuando quien completa es supervisor (control de calidad)
      ...(isSupervisor && { supervisorId: completedById }),
      ...(qualityApproved !== undefined && { qualityApproved }),
      ...(qualityNote && { qualityNote }),
      ...(notes && { notes }),
    },
    include: {
      lot: { select: { id: true, lotNumber: true } },
      template: true,
    },
  })

  // Si todas las fases del lote están completadas/omitidas → cerrar el lote
  const pendingPhases = await prisma.productionPhase.count({
    where: {
      lotId: phase.lotId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  })

  if (pendingPhases === 0) {
    await prisma.lot.update({
      where: { id: phase.lotId },
      data: { status: 'CLOSED', endDate: new Date() },
    })
  }

  return completed
}
