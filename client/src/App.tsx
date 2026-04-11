import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import LotListPage from './pages/Lots/LotList'
import LotDetailPage from './pages/Lots/LotDetail'
import LotCreatePage from './pages/Lots/LotCreate'
import PhaseRegisterPage from './pages/Phases/PhaseRegister'
import AlertListPage from './pages/Alerts/AlertList'
import AdminPage from './pages/Admin'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="lotes" element={<LotListPage />} />
          <Route path="lotes/nuevo" element={<LotCreatePage />} />
          <Route path="lotes/:id" element={<LotDetailPage />} />
          <Route path="lotes/:lotId/fases/:phaseId" element={<PhaseRegisterPage />} />
          <Route path="alertas" element={<AlertListPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
