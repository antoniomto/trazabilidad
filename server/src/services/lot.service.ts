import { prisma } from '../config/db'
import { LotCreateInput } from '@trazabilidad/shared'

function generateLotNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `LOT-${y}${m}${d}-${rand}`
}

export async function createLot(data: LotCreateInput, userId: string) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: data.productId } })
  const templates = await prisma.productPhaseTemplate.findMany({
    where: { productId: product.id },
    orderBy: { orderIndex: 'asc' },
  })

  // Ensure unique lot number
  let lotNumber = generateLotNumber()
  let exists = await prisma.lot.findUnique({ where: { lotNumber } })
  while (exists) {
    lotNumber = generateLotNumber()
    exists = await prisma.lot.findUnique({ where: { lotNumber } })
  }

  return prisma.lot.create({
    data: {
      lotNumber,
      productId: data.productId,
      batchSize: data.batchSize,
      batchUnit: data.batchUnit,
      notes: data.notes,
      createdById: userId,
      status: 'OPEN',
      rawMaterials: {
        create: data.rawMaterials.map((rm) => ({
          rawMaterialId: rm.rawMaterialId,
          quantity: rm.quantity,
          unit: rm.unit,
          supplierLot: rm.supplierLot,
          internalLot: rm.internalLot,
          chlorineConc: rm.chlorineConc,
          notes: rm.notes,
        })),
      },
      productionPhases: {
        create: templates.map((t) => ({
          templateId: t.id,
          name: t.name,
          orderIndex: t.orderIndex,
          status: 'PENDING',
        })),
      },
    },
    include: {
      product: true,
      rawMaterials: { include: { rawMaterial: true } },
      productionPhases: { orderBy: { orderIndex: 'asc' } },
    },
  })
}

export async function getLots(filters: { status?: string; productId?: string }) {
  return prisma.lot.findMany({
    where: {
      ...(filters.status && { status: filters.status as any }),
      ...(filters.productId && { productId: filters.productId }),
    },
    include: {
      product: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { alerts: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getLotDetail(id: string) {
  return prisma.lot.findUnique({
    where: { id },
    include: {
      product: true,
      createdBy: { select: { name: true, email: true } },
      releasedBy: { select: { name: true } },
      rawMaterials: { include: { rawMaterial: true } },
      productionPhases: {
        orderBy: { orderIndex: 'asc' },
        include: {
          operator: { select: { name: true } },
          supervisor: { select: { name: true } },
          parameters: {
            orderBy: { recordedAt: 'asc' },
            include: { recordedBy: { select: { name: true } } },
          },
          template: { select: { expectedParams: true, hasQualityCheck: true } },
        },
      },
      alerts: {
        orderBy: { createdAt: 'desc' },
        include: { acknowledgedBy: { select: { name: true } } },
      },
    },
  })
}

export async function releaseLot(lotId: string, userId: string, notes?: string) {
  return prisma.lot.update({
    where: { id: lotId },
    data: {
      status: 'RELEASED',
      releasedById: userId,
      releasedAt: new Date(),
      endDate: new Date(),
      ...(notes && { notes }),
    },
  })
}
