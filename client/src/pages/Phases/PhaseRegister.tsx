import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2, Save, Thermometer } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { queryClient } from '../../lib/queryClient'
import toast from 'react-hot-toast'
import { useState, useEffect, useRef } from 'react'

interface ExpectedParam {
  key: string
  label: string
  unit: string
  min?: number
  max?: number
}

export default function PhaseRegisterPage() {
  const { lotId, phaseId } = useParams<{ lotId: string; phaseId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isSupervisor = user?.role === 'SUPERVISOR' || user?.role === 'ADMIN'

  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [mermaKg, setMermaKg] = useState('')
  const [notes, setNotes] = useState('')
  const [qualityApproved, setQualityApproved] = useState<boolean | null>(null)
  const [qualityNote, setQualityNote] = useState('')

  const { data: lot } = useQuery({
    queryKey: ['lot', lotId],
    queryFn: () => api.get(`/lots/${lotId}`).then((r) => r.data),
  })

  const phase = lot?.productionPhases?.find((p: any) => p.id === phaseId)
  const expectedParams: ExpectedParam[] = (phase?.template?.expectedParams as ExpectedParam[]) ?? []
  const hasQualityCheck = phase?.template?.hasQualityCheck ?? false

  // Auto-start phase when entering the page if still PENDING
  const startMutation = useMutation({
    mutationFn: () => api.patch(`/phases/${phaseId}/start`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lot', lotId] }),
  })
  const autoStarted = useRef(false)
  useEffect(() => {
    if (phase?.status === 'PENDING' && !autoStarted.current && !startMutation.isPending) {
      autoStarted.current = true
      startMutation.mutate()
    }
  }, [phase?.status])

  // Pre-fill form with last saved parameter values when returning to an in-progress phase
  const prefilled = useRef(false)
  useEffect(() => {
    if (!phase || prefilled.current) return
    if (phase.status === 'IN_PROGRESS' && phase.parameters?.length > 0) {
      prefilled.current = true
      // Use the last saved value for each key (audit trail may have duplicates)
      const latest: Record<string, string> = {}
      for (const p of phase.parameters) {
        latest[p.key] = String(Number(p.value))
      }
      setParamValues(latest)
      if (phase.mermaKg) setMermaKg(String(Number(phase.mermaKg)))
      if (phase.notes) setNotes(phase.notes)
    }
  }, [phase?.id, phase?.status, phase?.parameters?.length])

  const saveParamsMutation = useMutation({
    mutationFn: (params: any) => api.post(`/phases/${phaseId}/parameters`, params).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lot', lotId] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      if (data.alerts?.length > 0) {
        toast.error(`⚠️ ${data.alerts.length} parámetro(s) fuera de rango detectado(s)`, { duration: 6000 })
      } else {
        toast.success('Parámetros guardados correctamente')
      }
    },
    onError: () => toast.error('Error al guardar parámetros'),
  })

  const completeMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/phases/${phaseId}/complete`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lot', lotId] })
      toast.success('Fase completada')
      navigate(`/lotes/${lotId}`)
    },
    onError: () => toast.error('Error al completar la fase'),
  })

  function getOutOfRange(key: string, value: string): boolean | null {
    const ep = expectedParams.find((e) => e.key === key)
    if (!ep || !value) return null
    const num = parseFloat(value)
    if (isNaN(num)) return null
    const underMin = ep.min !== undefined && num < ep.min
    const overMax = ep.max !== undefined && num > ep.max
    return underMin || overMax
  }

  async function handleSaveParams() {
    const parameters = expectedParams.map((ep) => ({
      key: ep.key,
      value: parseFloat(paramValues[ep.key] ?? '0'),
      unit: ep.unit,
    }))

    if (parameters.some((p) => isNaN(p.value))) {
      toast.error('Todos los parámetros son requeridos')
      return
    }

    await saveParamsMutation.mutateAsync({
      parameters,
      mermaKg: mermaKg ? parseFloat(mermaKg) : undefined,
      notes: notes || undefined,
    })
  }

  async function handleComplete() {
    if (hasQualityCheck && qualityApproved === null) {
      toast.error('Debes indicar el resultado del control de calidad')
      return
    }
    await completeMutation.mutateAsync({
      qualityApproved: hasQualityCheck ? qualityApproved : undefined,
      qualityNote: qualityNote || undefined,
      notes: notes || undefined,
    })
  }

  if (!lot || !phase) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(`/lotes/${lotId}`)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Volver al lote
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span className="font-mono">{lot.lotNumber}</span>
          <span>›</span>
          <span>Fase {phase.orderIndex}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{phase.name}</h1>
        <p className="text-slate-500 text-sm mt-1">{lot.product?.name}</p>
      </div>

      {/* Starting phase spinner */}
      {phase.status === 'PENDING' && (
        <div className="card p-6 mb-6 text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-3" size={28} />
          <p className="text-slate-600 text-sm">Iniciando fase...</p>
        </div>
      )}

      {phase.status === 'IN_PROGRESS' && (
        <>
          {/* Parameters */}
          {expectedParams.length > 0 && (
            <div className="card p-6 mb-4">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Thermometer size={16} className="text-blue-500" />
                Parámetros de control
              </h2>

              <div className="space-y-4">
                {expectedParams.map((ep) => {
                  const val = paramValues[ep.key] ?? ''
                  const outOfRange = getOutOfRange(ep.key, val)
                  return (
                    <div key={ep.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="label mb-0">
                          {ep.label || ep.key.replace(/_/g, ' ')}
                        </label>
                        {ep.min !== undefined || ep.max !== undefined ? (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            Rango: {ep.min !== undefined ? ep.min : '—'} – {ep.max !== undefined ? ep.max : '—'} {ep.unit}
                          </span>
                        ) : null}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={val}
                          onChange={(e) => setParamValues((prev) => ({ ...prev, [ep.key]: e.target.value }))}
                          className={`input pr-16 text-lg font-semibold ${
                            outOfRange === true
                              ? 'border-red-400 ring-2 ring-red-200 bg-red-50'
                              : outOfRange === false
                              ? 'border-emerald-400 ring-2 ring-emerald-100'
                              : ''
                          }`}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                          {ep.unit}
                        </span>
                      </div>
                      {outOfRange === true && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                          <AlertTriangle size={12} />
                          Valor fuera de rango — se generará una alerta
                        </p>
                      )}
                      {outOfRange === false && val && (
                        <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                          <CheckCircle size={12} /> Dentro del rango
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4">
                <label className="label">Merma (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  value={mermaKg}
                  onChange={(e) => setMermaKg(e.target.value)}
                  className="input"
                  placeholder="0.000"
                />
              </div>

              <div className="mt-4">
                <label className="label">Notas de la fase</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="Observaciones..."
                />
              </div>

              <button
                onClick={handleSaveParams}
                disabled={saveParamsMutation.isPending}
                className="btn-primary mt-4"
              >
                {saveParamsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                Guardar parámetros
              </button>
            </div>
          )}

          {/* Saved params */}
          {phase.parameters?.length > 0 && (
            <div className="card p-4 mb-4">
              <h3 className="font-medium text-slate-700 text-sm mb-3">Registros guardados</h3>
              <div className="space-y-2">
                {phase.parameters.map((p: any) => (
                  <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${
                    p.isOutOfRange ? 'bg-red-50 border border-red-200' : 'bg-slate-50'
                  }`}>
                    <span className="text-slate-600 flex items-center gap-1.5">
                      {p.isOutOfRange && <AlertTriangle size={12} className="text-red-500" />}
                      {p.key.replace(/_/g, ' ')}
                    </span>
                    <span className={`font-semibold ${p.isOutOfRange ? 'text-red-700' : 'text-slate-800'}`}>
                      {Number(p.value)} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality check (Cocción) */}
          {hasQualityCheck && isSupervisor && (
            <div className="card p-6 mb-4 border-2 border-amber-200 bg-amber-50/30">
              <h2 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <CheckCircle size={16} className="text-amber-500" />
                Control de Calidad
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Esta fase requiere aprobación de calidad por el supervisor antes de continuar.
              </p>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setQualityApproved(true)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                    qualityApproved === true
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  ✓ Aprobado
                </button>
                <button
                  onClick={() => setQualityApproved(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                    qualityApproved === false
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-red-300'
                  }`}
                >
                  ✗ No aprobado
                </button>
              </div>
              <input
                value={qualityNote}
                onChange={(e) => setQualityNote(e.target.value)}
                className="input"
                placeholder="Nota del supervisor..."
              />
            </div>
          )}

          {/* Complete phase */}
          {(isSupervisor || !hasQualityCheck) && (
            <div className="flex gap-3">
              <button onClick={() => navigate(`/lotes/${lotId}`)} className="btn-secondary flex-1">
                Guardar y salir
              </button>
              <button
                onClick={handleComplete}
                disabled={completeMutation.isPending || (hasQualityCheck && !isSupervisor)}
                className="btn-success flex-1"
              >
                {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} />}
                Completar fase
              </button>
            </div>
          )}

          {hasQualityCheck && !isSupervisor && (
            <p className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Esta fase requiere que un supervisor complete el control de calidad antes de finalizar.
            </p>
          )}
        </>
      )}

      {phase.status === 'COMPLETED' && (
        <div className="card p-6 text-center">
          <CheckCircle className="mx-auto text-emerald-500 mb-3" size={40} />
          <p className="text-lg font-semibold text-slate-800">Fase completada</p>
          <button onClick={() => navigate(`/lotes/${lotId}`)} className="btn-primary mt-4">
            Volver al lote
          </button>
        </div>
      )}
    </div>
  )
}
