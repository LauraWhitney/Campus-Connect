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
      style={{ background: 'linear-gradient(160deg,#060e1a 0%,#0d1f3c 45%,#1a2f5a 100%)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-navy-600 border-t-gold-400 animate-spin" />
        <p className="text-navy-400 text-sm">Loading Admin Panel…</p>
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
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1f3c',
              color: '#fff',
              border: '1px solid rgba(212,175,55,0.25)',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#d4af37', secondary: '#0d1f3c' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#0d1f3c' } },
          }}
        />
      </BrowserRouter>
    </AdminAuthProvider>
  )
}
