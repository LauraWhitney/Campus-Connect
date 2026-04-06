import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const TITLES: Record<string, string> = {
  '/dashboard':   'Overview',
  '/users':       'User Management',
  '/events':      'Events Management',
  '/marketplace': 'Marketplace Management',
  '/clubs':       'Clubs Management',
  '/lost-found':  'Lost & Found Management',
  '/feedback':    'Feedback & Reports',
  '/activity':    'Activity Logs',
}

export default function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation()
  const title = TITLES[location.pathname] ?? 'Admin Panel'
  const now = new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onMenuClick} aria-label="Open menu"
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-slate-900">{title}</h1>
            <p className="text-slate-500 text-xs hidden sm:block">{now}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-brand text-[10px] px-3">Admin</span>
        </div>
      </div>
    </header>
  )
}
