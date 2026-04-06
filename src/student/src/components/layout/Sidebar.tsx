import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, ShoppingBag, Users,
  Search, MessageSquare, LogOut, GraduationCap, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/events',      icon: Calendar,        label: 'Events'       },
  { to: '/marketplace', icon: ShoppingBag,     label: 'Marketplace'  },
  { to: '/clubs',       icon: Users,           label: 'Clubs'        },
  { to: '/lost-found',  icon: Search,          label: 'Lost & Found' },
  { to: '/feedback',    icon: MessageSquare,   label: 'Feedback'     },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _location = useLocation()

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full z-40 flex flex-col',
          'w-64 bg-surface-950 border-r border-surface-700/50',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto',
        )}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-surface-700/40">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-brand"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">Campus</p>
              <p className="font-display font-bold text-sm leading-tight text-brand-gradient"
                style={{
                  background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                Connect
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden text-surface-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-hidden">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => clsx('nav-link', isActive && 'active')}
            >
              <Icon style={{ width: '1.1rem', height: '1.1rem' }} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-surface-700/40">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center shrink-0">
              <span className="text-primary-300 text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name}</p>
              <p className="text-surface-400 text-xs truncate capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
