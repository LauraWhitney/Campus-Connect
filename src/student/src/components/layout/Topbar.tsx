import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Dashboard',    subtitle: 'Welcome back to Campus Connect' },
  '/events':      { title: 'Events',       subtitle: 'Browse and RSVP to campus events' },
  '/marketplace': { title: 'Marketplace',  subtitle: 'Buy and sell items with fellow students' },
  '/clubs':       { title: 'Clubs',        subtitle: 'Discover and join campus societies' },
  '/lost-found':  { title: 'Lost & Found', subtitle: 'Report or find lost items on campus' },
  '/feedback':    { title: 'Feedback',     subtitle: 'Send feedback to university departments' },
}

interface TopbarProps { onMenuClick: () => void }

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation()
  const meta = PAGE_TITLES[location.pathname] ?? { title: 'Campus Connect', subtitle: '' }

  return (
    <header className="sticky top-0 z-20 bg-blue-400 border-b border-slate-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onMenuClick} aria-label="Open menu"
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-semibold text-slate-900 leading-tight">
              {meta.title}
            </h1>
            <p className="text-slate-500 text-xs font-body mt-0.5 hidden sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Notifications"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500" />
          </button>
        </div>
      </div>
    </header>
  )
}
