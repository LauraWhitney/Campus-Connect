import { useEffect, useState, useCallback } from 'react'
import { Bell, MessageSquare, Calendar, Users, MapPin, Mail, RefreshCw, CheckCheck } from 'lucide-react'
import { notificationsAPI } from '../../api/notifications'
import type { AppNotification } from '../../types'
import { EmptyState, PageHeader } from '../../components/ui/index'
import toast from 'react-hot-toast'

const TYPE_META: Record<string, { icon: React.ReactNode; gradient: string }> = {
  feedback:  { icon: <MessageSquare className="w-4 h-4" />, gradient: 'linear-gradient(135deg,#c81e45,#d4af37)' },
  event:     { icon: <Calendar className="w-4 h-4" />,      gradient: 'linear-gradient(135deg,#3b82f6,#c81e45)' },
  club:      { icon: <Users className="w-4 h-4" />,         gradient: 'linear-gradient(135deg,#d4af37,#a855f7)' },
  lostfound: { icon: <MapPin className="w-4 h-4" />,        gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  contact:   { icon: <Mail className="w-4 h-4" />,          gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  system:    { icon: <Bell className="w-4 h-4" />,          gradient: 'linear-gradient(135deg,#94a3b8,#64748b)' },
}

function formatTime(d: string) {
  return new Date(d).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const REFRESH_MS = 20000

export default function NotificationsPage() {
  const [items, setItems]     = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread]   = useState(0)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await notificationsAPI.getAll(1)
      setItems(res.data)
      setUnread(res.unread_count)
    } catch {
      if (!silent) toast.error('Unable to load notifications.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const id = setInterval(() => load(true), REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  const handleSelect = async (n: AppNotification) => {
    if (n.is_read) return
    try {
      await notificationsAPI.markRead(n.id)
      setItems(it => it.map(i => i.id === n.id ? { ...i, is_read: true } : i))
      setUnread(u => Math.max(0, u - 1))
    } catch { toast.error('Failed to update notification') }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setItems(it => it.map(n => ({ ...n, is_read: true })))
      setUnread(0)
      toast.success('All notifications marked as read')
    } catch { toast.error('Failed to update notifications') }
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={`${items.length} notification${items.length !== 1 ? 's' : ''} · ${unread} unread`}
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => load()}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Refresh" aria-label="Refresh notifications">
              <RefreshCw className="w-4 h-4" />
            </button>
            {unread > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-2">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet"
          subtitle="Updates about your events, feedback and club memberships will appear here." />
      ) : (
        <div className="space-y-2">
          {items.map(n => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleSelect(n)}
                className={`w-full text-left card p-4 flex items-start gap-3 transition-all ${n.is_read ? 'opacity-70' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{ background: meta.gradient }}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-900 text-sm font-semibold truncate">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-slate-400 text-[11px] mt-1.5">{formatTime(n.created_at)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}