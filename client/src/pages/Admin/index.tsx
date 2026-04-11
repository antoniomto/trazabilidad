import { useQuery } from '@tanstack/react-query'
import { Users, Package, Beaker, Shield } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

const roleLabel = { ADMIN: 'Admin', SUPERVISOR: 'Supervisor', OPERATOR: 'Operario' }
const roleColor = {
  ADMIN:      'bg-purple-100 text-purple-700',
  SUPERVISOR: 'bg-amber-100 text-amber-700',
  OPERATOR:   'bg-blue-100 text-blue-700',
}

export default function AdminPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/admin/products').then((r) => r.data),
  })

  const { data: materials = [] } = useQuery({
    queryKey: ['rawMaterials'],
    queryFn: () => api.get('/admin/raw-materials').then((r) => r.data),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data),
    enabled: isAdmin,
  })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="text-purple-500" size={24} />
          Administración
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Configuración del sistema y catálogos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Package className="text-blue-500" size={18} />
            <h2 className="font-semibold text-slate-800">Productos</h2>
            <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{products.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {products.map((p: any) => (
              <div key={p.id} className="px-5 py-3">
                <p className="font-medium text-slate-800 text-sm">{p.name}</p>
                {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {p.phaseTemplates?.map((t: any) => (
                    <span key={t.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                      {t.orderIndex}. {t.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Sin productos configurados</div>
            )}
          </div>
        </div>

        {/* Raw materials */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Beaker className="text-emerald-500" size={18} />
            <h2 className="font-semibold text-slate-800">Materias Primas</h2>
            <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{materials.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {materials.map((m: any) => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{m.name}</p>
                  {m.supplier && <p className="text-xs text-slate-500">{m.supplier}</p>}
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{m.unit}</span>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Sin materias primas</div>
            )}
          </div>
        </div>

        {/* Users (admin only) */}
        {isAdmin && (
          <div className="card md:col-span-2">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="text-purple-500" size={18} />
              <h2 className="font-semibold text-slate-800">Usuarios</h2>
              <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{users.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                      <td className="px-5 py-3 text-slate-500">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColor[u.role as keyof typeof roleColor]}`}>
                          {roleLabel[u.role as keyof typeof roleLabel]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
