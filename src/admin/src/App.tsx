import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AdminAuthProvider, useAdminAuth } from './context/AuthContext'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import UsersPage from './pages/users/UsersPage'
import EventsPage from './pages/events/EventsPage'
import MarketplacePage from './pages/marketplace/MarketplacePage'
import ClubsPage from './pages/clubs/ClubsPage'
import LostFoundPage from './pages/lostfound/LostFoundPage'
import FeedbackPage from './pages/feedback/FeedbackPage'
import ActivityPage from './pages/activity/ActivityPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth()
  if (loading) return <FullScreenLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth()
  if (loading) return <FullScreenLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#f8fafc' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-slate-300 border-t-primary-500 animate-spin" />
        <p className="text-slate-500 text-sm">Loading Admin Panel…</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="dashboard"   element={<DashboardPage />} />
        <Route path="users"       element={<UsersPage />} />
        <Route path="events"      element={<EventsPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="clubs"       element={<ClubsPage />} />
        <Route path="lost-found"  element={<LostFoundPage />} />
        <Route path="feedback"    element={<FeedbackPage />} />
        <Route path="activity"    element={<ActivityPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1b4b',
              color: '#fff',
              border: '1px solid rgba(99,102,241,0.3)',
              fontFamily: '"Inter", sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#1e1b4b' } },
          }}
        />
      </BrowserRouter>
    </AdminAuthProvider>
  )
}
