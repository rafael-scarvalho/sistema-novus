import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { PortalAuthProvider, usePortalAuth } from './contexts/PortalAuthContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import PatientsPage from './pages/Patients'
import PatientDetailPage from './pages/PatientDetail'
import PartnersPage from './pages/Partners'
import CatalogPage from './pages/Catalog'
import BudgetsPage from './pages/Budgets'
import BudgetNewPage from './pages/BudgetNew'
import BudgetDetailPage from './pages/BudgetDetail'
import SurgeriesPage from './pages/Surgeries'
import SurgeryDetailPage from './pages/SurgeryDetail'
import FinancialPage from './pages/Financial'
import PortalPage from './pages/Portal'
import CalendarPage from './pages/Calendar'
import ReturnsPage from './pages/Returns'
import MessagesPage from './pages/Messages'
import ReportsPage from './pages/Reports'
import UsersPage from './pages/Users'
import PortalLogin from './pages/portal/PortalLogin'
import PortalDashboard from './pages/portal/PortalDashboard'
import PortalPatient from './pages/portal/PortalPatient'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function PortalPrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = usePortalAuth()
  return token ? <>{children}</> : <Navigate to="/portal/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Sistema interno */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/portal/:token" element={<PortalPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="pacientes" element={<PatientsPage />} />
        <Route path="pacientes/:id" element={<PatientDetailPage />} />
        <Route path="parceiros" element={<PartnersPage />} />
        <Route path="catalogo" element={<CatalogPage />} />
        <Route path="orcamentos" element={<BudgetsPage />} />
        <Route path="orcamentos/novo" element={<BudgetNewPage />} />
        <Route path="orcamentos/:id" element={<BudgetDetailPage />} />
        <Route path="cirurgias" element={<SurgeriesPage />} />
        <Route path="cirurgias/:id" element={<SurgeryDetailPage />} />
        <Route path="financeiro" element={<FinancialPage />} />
        <Route path="agenda" element={<CalendarPage />} />
        <Route path="retornos" element={<ReturnsPage />} />
        <Route path="mensagens" element={<MessagesPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="usuarios" element={<UsersPage />} />
      </Route>

      {/* Portal do Tutor */}
      <Route path="/portal/login" element={<PortalLogin />} />
      <Route
        path="/portal/dashboard"
        element={
          <PortalPrivateRoute>
            <PortalDashboard />
          </PortalPrivateRoute>
        }
      />
      <Route
        path="/portal/paciente/:patientId"
        element={
          <PortalPrivateRoute>
            <PortalPatient />
          </PortalPrivateRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <PortalAuthProvider>
      <AppRoutes />
    </PortalAuthProvider>
  )
}
