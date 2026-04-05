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
}

export default function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation()
  const title = TITLES[location.pathname] ?? 'Admin Panel'
  const now = new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header className="sticky top-0 z-20 bg-navy-900/80 backdrop-blur-md border-b border-navy-700/40 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="lg:hidden p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700/50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-white">{title}</h1>
            <p className="text-navy-500 text-xs hidden sm:block">{now}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-gold text-[10px] px-3">CUEA Admin</span>
        </div>
      </div>
    </header>
  )
}