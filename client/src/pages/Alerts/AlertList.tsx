import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, ArrowRight, Loader2, Bell } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { queryClient } from '../../lib/queryClient'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const severityConfig = {
  CRITICAL: { label: 'Crítica',    bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    icon: <AlertTriangle size={16} className="text-red-500" /> },
  WARNING:  { label: 'Advertencia', bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700', icon: <AlertTriangle size={16} className="text-amber-500" /> },
  INFO:     { label: 'Info',        bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   icon: <Bell size={16} className="text-blue-500" /> },
}

const statusFilters = [
  { value: '', label: 'Todas' },
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'ACKNOWLEDGED', label: 'Reconocidas' },
  { value: 'RESOLVED', label: 'Resueltas' },
]

export default function AlertListPage() {
  const user = useAuthStore((s) => s.user)
  const isSupervisor = user?.role === 'SUPERVISOR' || user?.role === 'ADMIN'
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [acknowledgeId, setAcknowledgeId] = useState<string | null>(null)
  const [acknowledgeNote, setAcknowledgeNote] = useState('')

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', statusFilter],
    queryFn: () => api.get('/alerts', { params: { status: statusFilter || undefined } }).then((r) => r.data),
    staleTime: 0,
    refetchInterval: 15_000,
  })

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      api.patch(`/alerts/${id}/acknowledge`, { acknowledgeNote: note }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setAcknowledgeId(null)
      setAcknowledgeNote('')
      toast.success('Alerta reconocida')
    },
    onError: () => toast.error('Error al reconocer la alerta'),
  })

  const activeCount = alerts.filter((a: any) => a.status === 'ACTIVE').length

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Alertas
          {activeCount > 0 && (
            <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Monitoreo de parámetros y condiciones críticas</p>
      </div>

      {/* Active critical banner */}
      {activeCount > 0 && statusFilter === 'ACTIVE' && (
        <div className="mb-6 p-4 bg-red-500 rounded-xl text-white flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <p className="font-semibold">
            {activeCount} alerta{activeCount > 1 ? 's' : ''} activa{activeCount > 1 ? 's' : ''} — requiere{activeCount > 1 ? 'n' : ''} atención
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle className="mx-auto text-emerald-400 mb-3" size={40} />
          <p className="text-slate-600 font-medium">No hay alertas en esta categoría</p>
          <p className="text-slate-400 text-sm mt-1">El sistema está operando dentro de parámetros normales</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => {
            const sc = severityConfig[alert.severity as keyof typeof severityConfig]
            return (
              <div
                key={alert.id}
                className={`card border ${sc.border} ${sc.bg} p-4`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">{sc.icon}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sc.badge}`}>
                        {sc.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        alert.status === 'ACTIVE' ? 'bg-red-100 text-red-600' :
                        alert.status === 'ACKNOWLEDGED' ? 'bg-amber-100 text-amber-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {alert.status === 'ACTIVE' ? 'Activa' : alert.status === 'ACKNOWLEDGED' ? 'Reconocida' : 'Resuelta'}
                      </span>
                    </div>

                    <p className={`font-medium text-sm ${sc.text} mb-1`}>{alert.message}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {format(new Date(alert.createdAt), "d 'de' MMM, HH:mm", { locale: es })}
                      </span>
                      {alert.lot && (
                        <Link
                          to={`/lotes/${alert.lot?.id ?? ''}`}
                          className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                        >
                          {alert.lot.lotNumber} <ArrowRight size={10} />
                        </Link>
                      )}
                      {alert.phase && <span>Fase: {alert.phase.name}</span>}
                    </div>

                    {alert.status === 'ACKNOWLEDGED' && alert.acknowledgeNote && (
                      <div className="mt-2 px-3 py-2 bg-white/60 rounded-lg text-xs text-slate-600">
                        <span className="font-medium">Nota: </span>{alert.acknowledgeNote}
                        {alert.acknowledgedBy && <span className="text-slate-400"> — {alert.acknowledgedBy.name}</span>}
                      </div>
                    )}
                  </div>

                  {/* Acknowledge button */}
                  {isSupervisor && alert.status === 'ACTIVE' && (
                    <button
                      onClick={() => setAcknowledgeId(alert.id)}
                      className="flex-shrink-0 btn-secondary text-xs py-1.5"
                    >
                      Reconocer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Acknowledge modal */}
      {acknowledgeId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Reconocer alerta</h2>
            <p className="text-slate-500 text-sm mb-4">
              Describe la acción tomada para atender esta alerta.
            </p>
            <div className="mb-4">
              <label className="label">Nota de reconocimiento *</label>
              <textarea
                value={acknowledgeNote}
                onChange={(e) => setAcknowledgeNote(e.target.value)}
                className="input"
                rows={3}
                placeholder="ej. Se ajustó temperatura a 88°C y se continuó el proceso..."
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setAcknowledgeId(null); setAcknowledgeNote('') }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!acknowledgeNote.trim()) { toast.error('La nota es requerida'); return }
                  acknowledgeMutation.mutate({ id: acknowledgeId, note: acknowledgeNote })
                }}
                disabled={acknowledgeMutation.isPending}
                className="btn-primary flex-1"
              >
                {acknowledgeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
