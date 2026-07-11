import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EventsPage from './pages/events/EventsPage'
import MarketplacePage from './pages/marketplace/MarketplacePage'
import ClubsPage from './pages/clubs/ClubsPage'
import LostFoundPage from './pages/lostfound/LostFoundPage'
import FeedbackPage from './pages/feedback/FeedbackPage'
import NotificationsPage from './pages/notifications/NotificationsPage'

// ── Guards ─────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  // Logged-in users visiting landing / login / register go straight to dashboard
  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#020617,#0f172a,#2e000b)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-700 border-t-indigo-400 animate-spin" />
        <p className="text-indigo-300 text-sm font-medium">Loading CUEA Campus Connect…</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Landing page ── */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

      {/* ── Auth pages (unauthenticated only) ── */}
      <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* ── Protected app shell — all under /app/* to avoid clashing with "/" ── */}
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"   element={<DashboardPage />} />
        <Route path="events"      element={<EventsPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="clubs"       element={<ClubsPage />} />
        <Route path="lost-found"  element={<LostFoundPage />} />
        <Route path="feedback"    element={<FeedbackPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* ── Convenience redirects — old /dashboard URLs still work ── */}
      <Route path="/dashboard"   element={<ProtectedRoute><Navigate to="/app/dashboard"   replace /></ProtectedRoute>} />
      <Route path="/events"      element={<ProtectedRoute><Navigate to="/app/events"      replace /></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><Navigate to="/app/marketplace" replace /></ProtectedRoute>} />
      <Route path="/clubs"       element={<ProtectedRoute><Navigate to="/app/clubs"       replace /></ProtectedRoute>} />
      <Route path="/lost-found"  element={<ProtectedRoute><Navigate to="/app/lost-found"  replace /></ProtectedRoute>} />
      <Route path="/feedback"    element={<ProtectedRoute><Navigate to="/app/feedback"    replace /></ProtectedRoute>} />

      {/* ── Catch-all → landing ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#2e000b',
              color: '#fff',
              border: '1px solid rgba(200,30,69,0.3)',
              fontFamily: '"Inter", sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#c81e45', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#2e000b' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}