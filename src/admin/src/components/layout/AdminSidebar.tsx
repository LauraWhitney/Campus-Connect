import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, ShoppingBag,
  UserCheck, Search, MessageSquare, LogOut, GraduationCap, X, Activity,
} from 'lucide-react'
import { useAdminAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Overview'      },
  { to: '/users',       icon: Users,           label: 'Users'         },
  { to: '/events',      icon: Calendar,        label: 'Events'        },
  { to: '/marketplace', icon: ShoppingBag,     label: 'Marketplace'   },
  { to: '/clubs',       icon: UserCheck,       label: 'Clubs'         },
  { to: '/lost-found',  icon: Search,          label: 'Lost & Found'  },
  { to: '/feedback',    icon: MessageSquare,   label: 'Feedback'      },
  { to: '/activity',    icon: Activity,        label: 'Activity Logs' },
]

export default function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAdminAuth()

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
        style={{ background: 'linear-gradient(180deg, #0a0e1a 0%, #0f172a 50%, #1e1b4b 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-[11px] font-bold font-display leading-tight">CUEA Campus Connect</p>
              <p className="text-[10px] font-semibold leading-tight mt-0.5"
                style={{ background: 'linear-gradient(90deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Admin Panel
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
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) => clsx('nav-link', isActive && 'active')}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: logged-in admin */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-indigo-400 text-[10px]">Administrator</p>
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
