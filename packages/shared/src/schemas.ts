import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(3, 'Contraseña requerida'),
})

export const LotCreateSchema = z.object({
  productId: z.string().uuid('Producto inválido'),
  batchSize: z.number().positive('El tamaño del lote debe ser positivo'),
  batchUnit: z.string().min(1, 'Unidad requerida'),
  notes: z.string().optional(),
  rawMaterials: z.array(
    z.object({
      rawMaterialId: z.string().uuid(),
      quantity: z.number().positive(),
      unit: z.string().min(1),
      supplierLot: z.string().min(1, 'Lote del fabricante requerido'),
      internalLot: z.string().min(1, 'Lote interno requerido'),
      chlorineConc: z.number().optional(),
      notes: z.string().optional(),
    })
  ).min(1, 'Debe agregar al menos una materia prima'),
})

export const PhaseParamSchema = z.object({
  parameters: z.array(
    z.object({
      key: z.string().min(1),
      value: z.number(),
      unit: z.string(),
      notes: z.string().optional(),
    })
  ),
  mermaKg: z.number().optional(),
  notes: z.string().optional(),
})

export const PhaseCompleteSchema = z.object({
  qualityApproved: z.boolean().optional(),
  qualityNote: z.string().optional(),
  notes: z.string().optional(),
})

export const AlertAcknowledgeSchema = z.object({
  acknowledgeNote: z.string().min(1, 'Debe ingresar una nota de reconocimiento'),
})

export const LotReleaseSchema = z.object({
  notes: z.string().optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type LotCreateInput = z.infer<typeof LotCreateSchema>
export type PhaseParamInput = z.infer<typeof PhaseParamSchema>
export type PhaseCompleteInput = z.infer<typeof PhaseCompleteSchema>
export type AlertAcknowledgeInput = z.infer<typeof AlertAcknowledgeSchema>
export type LotReleaseInput = z.infer<typeof LotReleaseSchema>
