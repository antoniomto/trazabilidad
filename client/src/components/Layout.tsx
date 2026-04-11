import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Bell, Settings, LogOut, Factory, Menu, X,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useAlertStream } from '../hooks/useAlertStream'
import { api } from '../lib/api'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/lotes',     icon: Package,         label: 'Lotes' },
  { to: '/alertas',   icon: Bell,            label: 'Alertas' },
  { to: '/admin',     icon: Settings,        label: 'Admin', roles: ['ADMIN', 'SUPERVISOR'] },
]

const roleLabel = { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', OPERATOR: 'Operario' }
const roleColor  = {
  ADMIN:      'bg-purple-100 text-purple-700',
  SUPERVISOR: 'bg-amber-100 text-amber-700',
  OPERATOR:   'bg-blue-100 text-blue-700',
}

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { activeCount } = useAlertStream()
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleLogout() {
    await api.post('/auth/logout').catch(() => {})
    logout()
    navigate('/login')
  }

  const visibleNavItems = navItems.filter(
    ({ roles }) => !roles || (user && roles.includes(user.role))
  )

  return (
    <div className="flex h-screen bg-slate-50">

      {/* ─── SIDEBAR — tablet md+ ───────────────────────────────────────────── */}
      <aside className="hidden md:flex w-16 lg:w-64 bg-gradient-to-b from-slate-900 to-slate-800 flex-col shadow-xl flex-shrink-0 transition-all duration-200">

        {/* Logo */}
        <div className="px-3 lg:px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div className="hidden lg:block">
              <p className="text-white font-semibold text-sm leading-tight">Trazabilidad</p>
              <p className="text-slate-400 text-xs">Planta Demo</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1">
          {visibleNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <div className="relative flex-shrink-0">
                <Icon size={20} />
                {label === 'Alertas' && activeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {activeCount > 9 ? '9+' : activeCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:block flex-1">{label}</span>
              {label === 'Alertas' && activeCount > 0 && (
                <span className="hidden lg:block bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {activeCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Alert pulse — desktop only */}
        {activeCount > 0 && (
          <div className="hidden lg:block mx-3 mb-3 p-3 bg-red-900/40 border border-red-700/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <p className="text-red-300 text-xs font-medium">
                {activeCount} alerta{activeCount > 1 ? 's' : ''} activa{activeCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* User — desktop only */}
        <div className="border-t border-slate-700 pt-3 pb-4 px-2 lg:px-3">
          <div className="hidden lg:block px-3 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[user?.role as keyof typeof roleColor]}`}>
              {roleLabel[user?.role as keyof typeof roleLabel]}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 text-sm transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden lg:inline">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN AREA ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TOP BAR — mobile only */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 shadow-lg flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Trazabilidad</p>
              <p className="text-slate-400 text-[10px]">Planta Demo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold px-2 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                {activeCount}
              </span>
            )}
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-slate-300 hover:text-white p-1"
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ─── BOTTOM NAV — mobile only ───────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 flex">
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
                isActive ? 'text-blue-400' : 'text-slate-400'
              }`
            }
          >
            <div className="relative">
              <Icon size={22} />
              {label === 'Alertas' && activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeCount > 9 ? '9+' : activeCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ─── MOBILE DRAWER ──────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-72 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Factory className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Trazabilidad</p>
                  <p className="text-slate-400 text-xs">Planta Demo</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {visibleNavItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  <div className="relative">
                    <Icon size={20} />
                    {label === 'Alertas' && activeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {activeCount}
                      </span>
                    )}
                  </div>
                  <span className="flex-1">{label}</span>
                  {label === 'Alertas' && activeCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {activeCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* User info */}
            <div className="px-4 pb-6 border-t border-slate-700 pt-4">
              <div className="flex items-center gap-3 px-2 py-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[user?.role as keyof typeof roleColor]}`}>
                    {roleLabel[user?.role as keyof typeof roleLabel]}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 text-sm transition-colors"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
