import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EventsPage from './pages/events/EventsPage'
import MarketplacePage from './pages/marketplace/MarketplacePage'
import ClubsPage from './pages/clubs/ClubsPage'
import LostFoundPage from './pages/lostfound/LostFoundPage'
import FeedbackPage from './pages/feedback/FeedbackPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-navy-600 border-t-gold-400 animate-spin" />
        <p className="text-navy-300 text-sm font-body">Loading Campus Connect…</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="clubs" element={<ClubsPage />} />
        <Route path="lost-found" element={<LostFoundPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
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
            error: { iconTheme: { primary: '#f87171', secondary: '#0d1f3c' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
