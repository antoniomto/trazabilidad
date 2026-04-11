import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle, Clock, AlertTriangle, Package, Beaker,
  ChevronRight, Play, Lock, Send, Star, Loader2,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { queryClient } from '../../lib/queryClient'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useState } from 'react'

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  OPEN:        { label: 'Abierto',    color: 'text-blue-700',    bg: 'bg-blue-100',    icon: <Clock size={14} /> },
  IN_PROGRESS: { label: 'En proceso', color: 'text-amber-700',   bg: 'bg-amber-100',   icon: <Play size={14} /> },
  CLOSED:      { label: 'Cerrado',    color: 'text-slate-600',   bg: 'bg-slate-100',   icon: <Lock size={14} /> },
  RELEASED:    { label: 'Liberado',   color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle size={14} /> },
  QUARANTINE:  { label: 'Cuarentena', color: 'text-red-700',     bg: 'bg-red-100',     icon: <AlertTriangle size={14} /> },
}

const phaseStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:     { label: 'Pendiente',   color: 'text-slate-500',   bg: 'bg-slate-100' },
  IN_PROGRESS: { label: 'En proceso',  color: 'text-amber-700',   bg: 'bg-amber-100' },
  COMPLETED:   { label: 'Completada',  color: 'text-emerald-700', bg: 'bg-emerald-100' },
  SKIPPED:     { label: 'Omitida',     color: 'text-slate-400',   bg: 'bg-slate-50' },
}

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [releaseNote, setReleaseNote] = useState('')
  const [showReleaseModal, setShowReleaseModal] = useState(false)

  const { data: lot, isLoading } = useQuery({
    queryKey: ['lot', id],
    queryFn: () => api.get(`/lots/${id}`).then((r) => r.data),
    staleTime: 10_000,
  })

  const releaseMutation = useMutation({
    mutationFn: () => api.patch(`/lots/${id}/release`, { notes: releaseNote }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lot', id] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      setShowReleaseModal(false)
      toast.success('Lote liberado exitosamente')
    },
    onError: () => toast.error('Error al liberar el lote'),
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  if (!lot) return <div className="p-6 text-slate-500">Lote no encontrado</div>

  const sc = statusConfig[lot.status]
  const activeAlerts = lot.alerts?.filter((a: any) => a.status === 'ACTIVE') ?? []
  const isSupervisor = user?.role === 'SUPERVISOR' || user?.role === 'ADMIN'
  const canRelease = isSupervisor && lot.status === 'CLOSED'

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Volver a lotes
      </button>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{lot.lotNumber}</h1>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${sc.bg} ${sc.color}`}>
              {sc.icon} {sc.label}
            </span>
          </div>
          <p className="text-slate-500">{lot.product?.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Creado por {lot.createdBy?.name} · {format(new Date(lot.createdAt), "d 'de' MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {canRelease && (
            <button onClick={() => setShowReleaseModal(true)} className="btn-success">
              <Star size={16} /> Liberar lote
            </button>
          )}
          {lot.status === 'RELEASED' && lot.releasedBy && (
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
              ✓ Liberado por {lot.releasedBy.name}
            </div>
          )}
        </div>
      </div>

      {/* Active alerts banner */}
      {activeAlerts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-semibold text-red-700">
              {activeAlerts.length} alerta{activeAlerts.length > 1 ? 's' : ''} activa{activeAlerts.length > 1 ? 's' : ''} en este lote
            </p>
            {activeAlerts.slice(0, 2).map((a: any) => (
              <p key={a.id} className="text-red-600 text-sm">{a.message}</p>
            ))}
            {isSupervisor && (
              <Link to="/alertas" className="text-red-600 underline text-sm mt-1 inline-block">
                Gestionar alertas →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: info + raw materials */}
        <div className="space-y-4">
          {/* Lot info */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Información</h3>
            <dl className="space-y-2 text-sm">
              <InfoRow label="Tamaño del lote" value={`${Number(lot.batchSize)} ${lot.batchUnit}`} />
              <InfoRow label="Producto" value={lot.product?.name} />
              <InfoRow label="Inicio" value={format(new Date(lot.startDate), 'dd/MM/yyyy HH:mm')} />
              {lot.endDate && <InfoRow label="Fin" value={format(new Date(lot.endDate), 'dd/MM/yyyy HH:mm')} />}
            </dl>
            {lot.notes && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">{lot.notes}</p>
              </div>
            )}
          </div>

          {/* Raw materials */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
              <Beaker size={14} /> Materias primas
            </h3>
            <div className="space-y-3">
              {lot.rawMaterials?.map((rm: any) => (
                <div key={rm.id} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-slate-700">{rm.rawMaterial?.name}</p>
                  <p className="text-slate-500">Cantidad: <span className="font-medium text-slate-700">{Number(rm.quantity)} {rm.unit}</span></p>
                  <p className="text-slate-500">Lote fabricante: <span className="font-mono font-medium text-slate-700">{rm.supplierLot}</span></p>
                  <p className="text-slate-500">Lote interno: <span className="font-mono font-medium text-slate-700">{rm.internalLot}</span></p>
                  {rm.chlorineConc && (
                    <p className="text-slate-500">Cl₂: <span className="font-medium text-slate-700">{Number(rm.chlorineConc)} ppm</span></p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Alerts summary */}
          {lot.alerts?.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle size={14} /> Alertas
              </h3>
              <div className="space-y-2">
                {lot.alerts.map((a: any) => (
                  <div key={a.id} className={`p-2.5 rounded-lg text-xs ${
                    a.severity === 'CRITICAL' ? 'bg-red-50 text-red-700' :
                    a.severity === 'WARNING' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    <p className="font-medium">{a.message}</p>
                    <p className="opacity-60 mt-0.5">
                      {a.status === 'ACKNOWLEDGED' ? `Reconocida: ${a.acknowledgeNote}` : a.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: phases timeline */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Fases de Producción</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lot.productionPhases?.filter((p: any) => p.status === 'COMPLETED').length} de{' '}
                {lot.productionPhases?.length} completadas
              </p>
            </div>

            <div className="divide-y divide-slate-50">
              {lot.productionPhases?.map((phase: any, idx: number) => {
                const psc = phaseStatusConfig[phase.status]
                const canStart = phase.status === 'PENDING' && (idx === 0 || lot.productionPhases[idx - 1]?.status === 'COMPLETED')
                const canRegister = phase.status === 'IN_PROGRESS'
                const hasAlerts = lot.alerts?.some((a: any) => a.phaseId === phase.id && a.status === 'ACTIVE')

                return (
                  <div key={phase.id} className={`px-5 py-4 ${hasAlerts ? 'bg-red-50/50' : ''}`}>
                    <div className="flex items-start gap-4">
                      {/* Step indicator */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        phase.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                        phase.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {phase.status === 'COMPLETED' ? '✓' : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-800 text-sm">{phase.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${psc.bg} ${psc.color}`}>
                            {psc.label}
                          </span>
                          {hasAlerts && (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <AlertTriangle size={11} /> Alerta
                            </span>
                          )}
                        </div>

                        {/* Timestamps */}
                        {phase.startedAt && (
                          <p className="text-xs text-slate-400">
                            Inicio: {format(new Date(phase.startedAt), 'dd/MM HH:mm')}
                            {phase.completedAt && ` · Fin: ${format(new Date(phase.completedAt), 'dd/MM HH:mm')}`}
                          </p>
                        )}

                        {/* Parameters */}
                        {phase.parameters?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {phase.parameters.map((p: any) => (
                              <span
                                key={p.id}
                                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium ${
                                  p.isOutOfRange
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {p.isOutOfRange && <AlertTriangle size={10} />}
                                {p.key.replace(/_/g, ' ')}: {Number(p.value)} {p.unit}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Merma */}
                        {phase.mermaKg && (
                          <p className="text-xs text-slate-500 mt-1">
                            Merma: <span className="font-medium text-slate-700">{Number(phase.mermaKg)} kg</span>
                          </p>
                        )}

                        {/* Quality checkpoint */}
                        {phase.template?.hasQualityCheck && phase.status === 'COMPLETED' && (
                          <div className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium ${
                            phase.qualityApproved
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {phase.qualityApproved ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                            Calidad: {phase.qualityApproved ? 'Aprobada' : 'No aprobada'}
                            {phase.qualityNote && ` — ${phase.qualityNote}`}
                          </div>
                        )}

                        {/* Operator */}
                        {phase.operator && (
                          <p className="text-xs text-slate-400 mt-1">
                            Operario: {phase.operator.name}
                            {phase.supervisor && ` · Supervisor: ${phase.supervisor.name}`}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0">
                        {canStart && (
                          <Link
                            to={`/lotes/${lot.id}/fases/${phase.id}`}
                            className="btn-primary text-xs py-2"
                          >
                            Iniciar <ChevronRight size={14} />
                          </Link>
                        )}
                        {canRegister && (
                          <Link
                            to={`/lotes/${lot.id}/fases/${phase.id}`}
                            className="btn-secondary text-xs py-2"
                          >
                            Continuar <ChevronRight size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Release modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Star className="text-emerald-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Liberar lote</h2>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              ¿Confirmas la liberación del lote <strong>{lot.lotNumber}</strong>? Esta acción indica que el lote pasó todos los controles de calidad.
            </p>
            <div className="mb-4">
              <label className="label">Notas de liberación (opcional)</label>
              <textarea
                value={releaseNote}
                onChange={(e) => setReleaseNote(e.target.value)}
                className="input"
                rows={3}
                placeholder="Observaciones finales del supervisor..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReleaseModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={() => releaseMutation.mutate()}
                disabled={releaseMutation.isPending}
                className="btn-success flex-1"
              >
                {releaseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} />}
                Liberar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-700 text-right">{value}</dd>
    </div>
  )
}
