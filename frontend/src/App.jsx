import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import LoginPage from './pages/LoginPage'
import LoadingSpinner from './components/LoadingSpinner'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'
import MobileLayout from './layouts/MobileLayout'

// Foreman pages
import ForemanHome from './pages/foreman/ForemanHome'
import AddDailyLog from './pages/foreman/AddDailyLog'
import AddLaborLog from './pages/foreman/AddLaborLog'
import AddMaterialLog from './pages/foreman/AddMaterialLog'
import ForemanProjects from './pages/foreman/ForemanProjects'
import ForemanProjectDetail from './pages/foreman/ForemanProjectDetail'
import ForemanDailyLogList from './pages/foreman/ForemanDailyLogList'
import ForemanMaterialList from './pages/foreman/ForemanMaterialList'
import ForemanMaterialDetail from './pages/foreman/ForemanMaterialDetail'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ProjectsPage from './pages/admin/ProjectsPage'
import WorkersPage from './pages/admin/WorkersPage'
import FinancePage from './pages/admin/FinancePage'
import AccountingPage from './pages/admin/AccountingPage'
import ReportsPage from './pages/admin/ReportsPage'
import PhaseTemplatesPage from './pages/admin/PhaseTemplatesPage'

// Accountant pages
import AccountantDashboard from './pages/accountant/AccountantDashboard'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner size="lg" text="กำลังโหลด..." />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to role-appropriate home
    const roleHome = {
      admin: '/admin',
      foreman: '/foreman',
      accountant: '/accountant',
    }
    return <Navigate to={roleHome[user.role] || '/login'} replace />
  }

  return children
}

function RoleRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner size="lg" text="กำลังโหลด..." />
  if (!user) return <Navigate to="/login" replace />

  const roleHome = {
    admin: '/admin',
    foreman: '/foreman',
    accountant: '/accountant',
  }

  return <Navigate to={roleHome[user.role] || '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Role redirect */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Foreman routes */}
      <Route path="/foreman" element={
        <ProtectedRoute allowedRoles={['foreman', 'admin']}>
          <MobileLayout><ForemanHome /></MobileLayout>
        </ProtectedRoute>
      } />
      <Route path="/foreman/projects" element={
        <ProtectedRoute allowedRoles={['foreman', 'admin']}>
          <MobileLayout><ForemanProjects /></MobileLayout>
        </ProtectedRoute>
      } />
      <Route path="/foreman/projects/:id" element={
        <ProtectedRoute allowedRoles={['foreman', 'admin']}>
          <MobileLayout><ForemanProjectDetail /></MobileLayout>
        </ProtectedRoute>
      } />
      <Route path="/foreman/daily-log" element={
        <ProtectedRoute allowedRoles={['foreman', 'admin']}>
          <MobileLayout><ForemanDailyLogList /></MobileLayout>
        </ProtectedRoute>
      } />
      <Route path="/foreman/daily-log/add" element={
        <ProtectedRoute allowedRoles={['foreman', 'admin']}>
          <MobileLayout><AddDailyLog /></MobileLayout>
        </ProtectedRoute>
      } />
      <Route path="/foreman/labor" element={
        <ProtectedRoute allowedRoles={['foreman', 'admin']}>
          <MobileLayout><AddLaborLog /></MobileLayout>
        </ProtectedRoute>
      } />
      <Route path="/foreman/material" element={
        <ProtectedRoute allowedRoles={['foreman', 'admin']}>
          <MobileLayout><ForemanMaterialList /></MobileLayout>
        </ProtectedRoute>
      } />
      <Route path="/foreman/material/:id" element={
        <ProtectedRoute allowedRoles={['foreman', 'admin']}>
          <MobileLayout><ForemanMaterialDetail /></MobileLayout>
        </ProtectedRoute>
      } />
      <Route path="/foreman/material/add" element={
        <ProtectedRoute allowedRoles={['foreman', 'admin']}>
          <MobileLayout><AddMaterialLog /></MobileLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><AdminDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/projects" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><ProjectsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/workers" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><WorkersPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/finance" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><FinancePage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/accounting" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><AccountingPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><ReportsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/phase-templates" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><PhaseTemplatesPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Accountant routes */}
      <Route path="/accountant" element={
        <ProtectedRoute allowedRoles={['accountant', 'admin']}>
          <DashboardLayout><AccountantDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
