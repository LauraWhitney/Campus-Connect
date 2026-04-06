import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'

// Titles + subtitles mapping like Student Topbar
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Overview', subtitle: 'Welcome to the admin panel' },
  '/users':       { title: 'User Management', subtitle: 'Manage users on the platform' },
  '/events':      { title: 'Events Management', subtitle: 'Manage campus events' },
  '/marketplace': { title: 'Marketplace Management', subtitle: 'Oversee marketplace items' },
  '/clubs':       { title: 'Clubs Management', subtitle: 'Manage campus societies' },
  '/lost-found':  { title: 'Lost & Found Management', subtitle: 'Track lost & found items' },
  '/feedback':    { title: 'Feedback & Reports', subtitle: 'View and respond to feedback' },
  '/activity':    { title: 'Activity Logs', subtitle: 'Monitor platform activity' },
}

interface AdminTopbarProps { onMenuClick: () => void }

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const location = useLocation()
  const meta = PAGE_TITLES[location.pathname] ?? { title: 'Admin Panel', subtitle: '' }

  return (
    <header className="sticky top-0 z-20 bg-blue-400 border-b border-slate-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section: Menu + Title */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="lg:hidden p-2 rounded-lg text-slate-50 hover:text-slate-100 hover:bg-blue-500 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-semibold text-white leading-tight">
              {meta.title}
            </h1>
            <p className="text-slate-200 text-xs font-body mt-0.5 hidden sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right section: Notifications + Admin badge */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-slate-50 hover:text-slate-100 hover:bg-blue-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500" />
          </button>
          <span className="badge-brand text-[10px] px-3 py-1 bg-white text-blue-500 rounded-full">Admin</span>
        </div>
      </div>
    </header>
  )
}