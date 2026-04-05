import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Dashboard',   subtitle: 'Welcome back to Campus Connect' },
  '/events':      { title: 'Events',      subtitle: 'Browse and RSVP to campus events' },
  '/marketplace': { title: 'Marketplace', subtitle: 'Buy and sell items with fellow students' },
  '/clubs':       { title: 'Clubs',       subtitle: 'Discover and join campus societies' },
  '/lost-found':  { title: 'Lost & Found',subtitle: 'Report or find lost items on campus' },
  '/feedback':    { title: 'Feedback',    subtitle: 'Send feedback to university departments' },
}

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation()
  const meta = PAGE_TITLES[location.pathname] ?? { title: 'Campus Connect', subtitle: '' }

  return (
    <header className="sticky top-0 z-20 bg-navy-900/80 backdrop-blur-md border-b border-navy-700/40 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            title="Open menu"
            className="lg:hidden p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700/50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="font-display text-xl font-semibold text-white leading-tight">
              {meta.title}
            </h1>
            <p className="text-navy-400 text-xs font-body mt-0.5 hidden sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="relative p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700/50 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold-400" />
          </button>
        </div>
      </div>
    </header>
  )
}