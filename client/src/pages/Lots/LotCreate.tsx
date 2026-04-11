import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Loader2, ArrowLeft, Package } from 'lucide-react'
import { LotCreateSchema, LotCreateInput } from '@trazabilidad/shared'
import { api } from '../../lib/api'
import { queryClient } from '../../lib/queryClient'
import toast from 'react-hot-toast'

export default function LotCreatePage() {
  const navigate = useNavigate()

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/admin/products').then((r) => r.data),
  })

  const { data: rawMaterials = [] } = useQuery({
    queryKey: ['rawMaterials'],
    queryFn: () => api.get('/admin/raw-materials').then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LotCreateInput>({
    resolver: zodResolver(LotCreateSchema),
    defaultValues: {
      batchUnit: 'kg',
      rawMaterials: [{ rawMaterialId: '', quantity: 0, unit: 'kg', supplierLot: '', internalLot: '', chlorineConc: undefined }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'rawMaterials' })

  const createMutation = useMutation({
    mutationFn: (data: LotCreateInput) => api.post('/lots', data).then((r) => r.data),
    onSuccess: (lot) => {
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      toast.success(`Lote ${lot.lotNumber} creado exitosamente`)
      navigate(`/lotes/${lot.id}`)
    },
    onError: () => toast.error('Error al crear el lote'),
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Package className="text-blue-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nuevo Lote de Producción</h1>
          <p className="text-slate-500 text-sm">El número de lote se generará automáticamente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-6">
        {/* Product + batch */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-base">Información del lote</h2>

          <div>
            <label className="label">Producto *</label>
            <select {...register('productId')} className="input">
              <option value="">— Seleccionar producto —</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.productId && <p className="text-red-500 text-xs mt-1">{errors.productId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tamaño del lote *</label>
              <input
                {...register('batchSize', { valueAsNumber: true })}
                type="number"
                step="0.001"
                className="input"
                placeholder="0.000"
              />
              {errors.batchSize && <p className="text-red-500 text-xs mt-1">{errors.batchSize.message}</p>}
            </div>
            <div>
              <label className="label">Unidad *</label>
              <select {...register('batchUnit')} className="input">
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="pzas">piezas</option>
                <option value="cajas">cajas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea {...register('notes')} className="input" rows={2} placeholder="Observaciones generales del lote..." />
          </div>
        </div>

        {/* Raw materials */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Materias primas</h2>
            <button
              type="button"
              onClick={() => append({ rawMaterialId: '', quantity: 0, unit: 'kg', supplierLot: '', internalLot: '' })}
              className="btn-secondary text-sm py-1.5"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>

          {errors.rawMaterials && typeof errors.rawMaterials === 'object' && !Array.isArray(errors.rawMaterials) && (
            <p className="text-red-500 text-xs">{(errors.rawMaterials as any).message}</p>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-600">Ingrediente #{index + 1}</span>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div>
                <label className="label">Materia prima *</label>
                <select {...register(`rawMaterials.${index}.rawMaterialId`)} className="input">
                  <option value="">— Seleccionar —</option>
                  {rawMaterials.map((rm: any) => (
                    <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cantidad *</label>
                  <input
                    {...register(`rawMaterials.${index}.quantity`, { valueAsNumber: true })}
                    type="number" step="0.001" className="input" placeholder="0.000"
                  />
                </div>
                <div>
                  <label className="label">Unidad *</label>
                  <select {...register(`rawMaterials.${index}.unit`)} className="input">
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="g">g</option>
                    <option value="pzas">pzas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">N° Lote Fabricante *</label>
                  <input {...register(`rawMaterials.${index}.supplierLot`)} className="input font-mono" placeholder="ej. FAB-2026-001" />
                </div>
                <div>
                  <label className="label">N° Lote Interno *</label>
                  <input {...register(`rawMaterials.${index}.internalLot`)} className="input font-mono" placeholder="ej. INT-2026-0888" />
                </div>
              </div>

              <div>
                <label className="label">Concentración Cl₂ (ppm)</label>
                <input
                  {...register(`rawMaterials.${index}.chlorineConc`, { valueAsNumber: true })}
                  type="number" step="0.01" className="input" placeholder="ej. 1.5"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
            Crear lote
          </button>
        </div>
      </form>
    </div>
  )
}
