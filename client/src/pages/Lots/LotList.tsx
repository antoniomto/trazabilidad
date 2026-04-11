import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Package, AlertTriangle, ArrowRight, Filter } from 'lucide-react'
import { api } from '../../lib/api'
import { format } from 'date-fns'

const statusConfig = {
  OPEN:        { label: 'Abierto',    color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  IN_PROGRESS: { label: 'En proceso', color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500 animate-pulse' },
  CLOSED:      { label: 'Cerrado',    color: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400' },
  RELEASED:    { label: 'Liberado',   color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  QUARANTINE:  { label: 'Cuarentena', color: 'bg-red-100 text-red-700',         dot: 'bg-red-500' },
}

const filters = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abiertos' },
  { value: 'IN_PROGRESS', label: 'En proceso' },
  { value: 'RELEASED', label: 'Liberados' },
  { value: 'QUARANTINE', label: 'Cuarentena' },
]

export default function LotListPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['lots', statusFilter],
    queryFn: () => api.get('/lots', { params: { status: statusFilter || undefined } }).then((r) => r.data),
    staleTime: 15_000,
  })

  const filtered = lots.filter(
    (l: any) =>
      l.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.product?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lotes de Producción</h1>
          <p className="text-slate-500 text-sm mt-0.5">{lots.length} lotes en total</p>
        </div>
        <Link to="/lotes/nuevo" className="btn-primary">
          <Plus size={16} /> Nuevo lote
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por lote o producto..."
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Cargando lotes...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500 mb-4">No se encontraron lotes</p>
            <Link to="/lotes/nuevo" className="btn-primary">
              <Plus size={16} /> Crear lote
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lote</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Creado por</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Alertas</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((lot: any) => {
                  const sc = statusConfig[lot.status as keyof typeof statusConfig]
                  const alertCount = lot._count?.alerts ?? 0
                  return (
                    <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                          <span className="font-mono font-semibold text-slate-800">{lot.lotNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{lot.product?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{lot.createdBy?.name}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {format(new Date(lot.createdAt), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        {alertCount > 0 ? (
                          <span className="flex items-center gap-1.5 text-red-600 font-medium">
                            <AlertTriangle size={14} /> {alertCount}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/lotes/${lot.id}`}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-xs"
                        >
                          Ver <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
