import { useEffect, useRef, useState } from 'react'
import { Menu, Bell, MessageSquare, Calendar, Users, MapPin, Mail } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { notificationsAPI } from '../../api/notifications'
import type { AppNotification } from '../../types'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/app/dashboard':     { title: 'Dashboard',    subtitle: 'Welcome to CUEA Campus Connect' },
  '/app/events':        { title: 'Events',       subtitle: 'Browse, RSVP and check in to campus events' },
  '/app/marketplace':   { title: 'Marketplace',  subtitle: 'Buy and sell items with fellow CUEA students' },
  '/app/clubs':         { title: 'Clubs & Societies', subtitle: 'Discover and join CUEA clubs and societies' },
  '/app/lost-found':    { title: 'Lost & Found', subtitle: 'Report or claim lost items on campus' },
  '/app/feedback':      { title: 'Feedback',     subtitle: 'Submit feedback to CUEA departments' },
  '/app/notifications': { title: 'Notifications', subtitle: 'Updates on your events, feedback and clubs' },
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  feedback:  <MessageSquare className="w-3.5 h-3.5" />,
  event:     <Calendar className="w-3.5 h-3.5" />,
  club:      <Users className="w-3.5 h-3.5" />,
  lostfound: <MapPin className="w-3.5 h-3.5" />,
  contact:   <Mail className="w-3.5 h-3.5" />,
  system:    <Bell className="w-3.5 h-3.5" />,
}

const POLL_MS = 20000

interface TopbarProps { onMenuClick: () => void }

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation()
  const navigate  = useNavigate()
  const meta = PAGE_TITLES[location.pathname] ?? { title: 'Campus Connect', subtitle: 'CUEA' }

  const [open, setOpen]     = useState(false)
  const [unread, setUnread] = useState(0)
  const [recent, setRecent] = useState<AppNotification[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [recentError, setRecentError]     = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const refresh = async () => {
    try { setUnread(await notificationsAPI.unreadCount()) } catch { /* silent */ }
  }

  const loadRecent = async () => {
    setLoadingRecent(true)
    try {
      const res = await notificationsAPI.getAll(1)
      setRecent(res.data.slice(0, 5))
      setUnread(res.unread_count)
      setRecentError(false)
    } catch {
      setRecentError(true)
    } finally {
      setLoadingRecent(false)
    }
  }

  useEffect(() => {
    refresh()
    loadRecent()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { if (open) loadRecent() }, [open])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleSelect = async (n: AppNotification) => {
    if (!n.is_read) {
      try { await notificationsAPI.markRead(n.id) } catch { /* ignore */ }
      setUnread(u => Math.max(0, u - 1))
    }
    setOpen(false)
    navigate('/app/notifications')
  }

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

        {/* Right: bell with live dropdown */}
        <div className="relative" ref={ref}>
          <button type="button" aria-label="Notifications" onClick={() => setOpen(o => !o)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-surface-600/60 bg-surface-800 shadow-card overflow-hidden z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-surface-700/50 flex items-center justify-between">
                <p className="text-white text-sm font-semibold">Notifications</p>
                {unread > 0 && <span className="text-[10px] text-indigo-300 font-medium">{unread} unread</span>}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-hidden">
                {loadingRecent && recent.length === 0 ? (
                  <p className="text-surface-400 text-xs px-4 py-6 text-center">Loading…</p>
                ) : recentError && recent.length === 0 ? (
                  <p className="text-surface-400 text-xs px-4 py-6 text-center">Couldn't load notifications.</p>
                ) : recent.length === 0 ? (
                  <p className="text-surface-400 text-xs px-4 py-6 text-center">You're all caught up.</p>
                ) : (
                  recent.map(n => (
                    <button key={n.id} type="button" onClick={() => handleSelect(n)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-white/5 transition-colors border-b border-surface-700/30 last:border-0 ${n.is_read ? 'opacity-60' : ''}`}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-indigo-300 bg-indigo-500/15">
                        {TYPE_ICON[n.type] ?? TYPE_ICON.system}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">{n.title}</p>
                        <p className="text-surface-400 text-[11px] truncate">{n.message}</p>
                      </div>
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1" />}
                    </button>
                  ))
                )}
              </div>
              <button type="button" onClick={() => { setOpen(false); navigate('/app/notifications') }}
                className="w-full text-center py-2.5 text-indigo-300 text-xs font-semibold hover:bg-white/5 transition-colors border-t border-surface-700/50">
                View all notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
