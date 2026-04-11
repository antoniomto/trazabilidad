import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, CheckCircle, Clock, Plus, ArrowRight, Activity } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const statusConfig = {
  OPEN:        { label: 'Abierto',      color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  IN_PROGRESS: { label: 'En proceso',   color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  CLOSED:      { label: 'Cerrado',      color: 'bg-slate-100 text-slate-600',  dot: 'bg-slate-400' },
  RELEASED:    { label: 'Liberado',     color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  QUARANTINE:  { label: 'Cuarentena',   color: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: () => api.get('/lots').then((r) => r.data),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const { data: alertsCount } = useQuery({
    queryKey: ['alerts', 'active-count'],
    queryFn: () => api.get('/alerts/active/count').then((r) => r.data.count),
    staleTime: 0,
    refetchInterval: 15_000,
  })

  const open = lots.filter((l: any) => l.status === 'OPEN').length
  const inProgress = lots.filter((l: any) => l.status === 'IN_PROGRESS').length
  const released = lots.filter((l: any) => l.status === 'RELEASED').length

  const recentLots = lots.slice(0, 8)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <Link to="/lotes/nuevo" className="btn-primary">
          <Plus size={16} />
          Nuevo lote
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard
          icon={<Package className="text-blue-600" size={22} />}
          bg="bg-blue-50"
          label="Lotes abiertos"
          value={open}
        />
        <StatCard
          icon={<Activity className="text-amber-600" size={22} />}
          bg="bg-amber-50"
          label="En proceso"
          value={inProgress}
        />
        <StatCard
          icon={<CheckCircle className="text-emerald-600" size={22} />}
          bg="bg-emerald-50"
          label="Liberados"
          value={released}
        />
        <StatCard
          icon={<AlertTriangle className="text-red-600" size={22} />}
          bg="bg-red-50"
          label="Alertas activas"
          value={alertsCount ?? 0}
          danger={alertsCount > 0}
          link="/alertas"
        />
      </div>

      {/* Recent lots */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Lotes recientes</h2>
          <Link to="/lotes" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {recentLots.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500">No hay lotes todavía.</p>
            <Link to="/lotes/nuevo" className="btn-primary mt-4 inline-flex">
              <Plus size={16} /> Crear primer lote
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentLots.map((lot: any) => {
              const sc = statusConfig[lot.status as keyof typeof statusConfig]
              const alertCount = lot._count?.alerts ?? 0
              return (
                <Link
                  key={lot.id}
                  to={`/lotes/${lot.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{lot.lotNumber}</p>
                    <p className="text-xs text-slate-500 truncate">{lot.product?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {alertCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                        <AlertTriangle size={12} /> {alertCount}
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.color}`}>
                      {sc.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(lot.createdAt), 'dd/MM HH:mm')}
                    </span>
                    <ArrowRight size={14} className="text-slate-300" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon, bg, label, value, danger, link,
}: {
  icon: React.ReactNode
  bg: string
  label: string
  value: number
  danger?: boolean
  link?: string
}) {
  const inner = (
    <div className={`card p-5 ${danger && value > 0 ? 'ring-2 ring-red-300 ring-offset-1' : ''}`}>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${danger && value > 0 ? 'text-red-600' : 'text-slate-800'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
    </div>
  )
  if (link) return <Link to={link}>{inner}</Link>
  return inner
}
