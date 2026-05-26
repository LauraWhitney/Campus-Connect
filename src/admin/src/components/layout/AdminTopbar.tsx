import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Overview',                subtitle: 'CUEA Campus Connect platform stats' },
  '/users':       { title: 'User Management',         subtitle: 'Manage registered students, lecturers and admins' },
  '/events':      { title: 'Events Management',       subtitle: 'Manage CUEA campus events' },
  '/marketplace': { title: 'Marketplace Management',  subtitle: 'Oversee student marketplace listings' },
  '/clubs':       { title: 'Clubs & Societies',       subtitle: 'Manage CUEA clubs and societies' },
  '/lost-found':  { title: 'Lost & Found',            subtitle: 'Track reported and claimed items' },
  '/feedback':    { title: 'Feedback & Reports',      subtitle: 'Review and respond to student feedback' },
  '/activity':    { title: 'Activity Logs',           subtitle: 'Monitor all platform transactions' },
}

interface AdminTopbarProps { onMenuClick: () => void }

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const location = useLocation()
  const meta = PAGE_TITLES[location.pathname] ?? { title: 'Admin Panel', subtitle: 'CUEA Campus Connect' }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/10 px-4 sm:px-6 py-4"
      style={{ background: 'linear-gradient(90deg,#0f172a,#1e1b4b)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center justify-between">
        {/* Left: hamburger + page title */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={onMenuClick} aria-label="Open sidebar menu"
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-white leading-tight">{meta.title}</h1>
            <p className="text-indigo-300 text-xs mt-0.5 hidden sm:block">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right: notification bell + admin badge */}
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Notifications"
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          </button>
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-full border border-indigo-500/40 text-indigo-300"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            CUEA Admin
          </span>
        </div>
      </div>
    </header>
  )
}
