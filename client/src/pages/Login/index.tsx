import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Factory, Eye, EyeOff, Loader2 } from 'lucide-react'
import { LoginSchema, LoginInput } from '@trazabilidad/shared'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const DEMO_USERS = [
  { label: 'Operario', email: 'operario@planta.com', password: 'op123', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { label: 'Supervisor', email: 'supervisor@planta.com', password: 'sup123', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { label: 'Admin', email: 'admin@planta.com', password: 'admin123', color: 'bg-purple-50 border-purple-200 text-purple-700' },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) })

  async function onSubmit(data: LoginInput) {
    try {
      const res = await api.post('/auth/login', data)
      setAuth(res.data.user, res.data.accessToken)
      navigate('/dashboard')
    } catch {
      toast.error('Credenciales incorrectas')
    }
  }

  function fillDemo(email: string, password: string) {
    setValue('email', email)
    setValue('password', password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-500 items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sistema de Trazabilidad</h1>
          <p className="text-slate-400 mt-1 text-sm">Planta Procesadora Demo</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                {...register('email')}
                type="email"
                className="input"
                placeholder="correo@planta.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary justify-center py-3 text-base mt-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Entrar
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Usuarios de demo</p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => fillDemo(u.email, u.password)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:opacity-80 ${u.color}`}
                >
                  <span>{u.label}</span>
                  <span className="text-xs opacity-60">{u.email}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Haz clic en un usuario para auto-rellenar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
