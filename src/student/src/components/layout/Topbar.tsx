import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/app/dashboard':   { title: 'Dashboard',    subtitle: 'Welcome to CUEA Campus Connect' },
  '/app/events':      { title: 'Events',       subtitle: 'Browse, RSVP and check in to campus events' },
  '/app/marketplace': { title: 'Marketplace',  subtitle: 'Buy and sell items with fellow CUEA students' },
  '/app/clubs':       { title: 'Clubs & Societies', subtitle: 'Discover and join CUEA clubs and societies' },
  '/app/lost-found':  { title: 'Lost & Found', subtitle: 'Report or claim lost items on campus' },
  '/app/feedback':    { title: 'Feedback',     subtitle: 'Submit feedback to CUEA departments' },
}

interface TopbarProps { onMenuClick: () => void }

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation()
  const meta = PAGE_TITLES[location.pathname] ?? { title: 'Campus Connect', subtitle: 'CUEA' }

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 px-4 sm:px-6 py-4"
      style={{ background: 'linear-gradient(90deg,#0a0e1a,#0f172a)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center justify-between">
        {/* Left: hamburger + page title */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={onMenuClick} aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-white leading-tight">{meta.title}</h1>
            <p className="text-indigo-300 text-xs mt-0.5 hidden sm:block">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right: bell */}
        <button type="button" aria-label="Notifications"
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        </button>
      </div>
    </header>
  )
}
