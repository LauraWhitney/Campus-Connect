import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, ShoppingBag, Users,
  Search, MessageSquare, LogOut, GraduationCap, X, Bell,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const NAV = [
  { to: '/app/dashboard',   icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/app/events',      icon: Calendar,        label: 'Events'        },
  { to: '/app/marketplace', icon: ShoppingBag,     label: 'Marketplace'   },
  { to: '/app/clubs',       icon: Users,           label: 'Clubs'         },
  { to: '/app/lost-found',  icon: Search,          label: 'Lost & Found'  },
  { to: '/app/feedback',    icon: MessageSquare,   label: 'Feedback'      },
  { to: '/app/notifications', icon: Bell,          label: 'Notifications' },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full z-40 w-60 flex flex-col',
          'border-r border-white/5 transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto',
        )}
        style={{ background: 'linear-gradient(180deg,#0a0e1a 0%,#0f172a 50%,#2e000b 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-[11px] font-bold font-display leading-tight">CUEA Campus</p>
              <p className="text-[10px] font-semibold leading-tight mt-0.5"
                style={{ background: 'linear-gradient(90deg,#c81e45,#e9ba3f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Connect
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close sidebar"
            className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hidden">
          {NAV.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <NavLink key={to} to={to} onClick={onClose}
                className={clsx('nav-link', isActive && 'active')}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer: user profile + logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-indigo-400 text-[10px] truncate">{user?.email}</p>
            </div>
          </div>
          <button type="button" onClick={logout}
            className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4 shrink-0" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}