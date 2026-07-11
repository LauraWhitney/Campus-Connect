import { useEffect, useState, useCallback } from 'react'
import { Bell, MessageSquare, Calendar, Users, MapPin, Mail, RefreshCw, CheckCheck, Loader2 } from 'lucide-react'
import { notificationsAPI, type AdminNotification } from '../../api/admin'
import { PageHeader, EmptyState, Pagination, TableSkeleton } from '../../components/ui/index'
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

// Auto-refresh interval — keeps the feed current without requiring a manual reload.
const REFRESH_MS = 20000

export default function NotificationsPage() {
  const [items, setItems]     = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [pages, setPages]     = useState(1)
  const [total, setTotal]     = useState(0)
  const [unread, setUnread]   = useState(0)
  const [replyingId, setReplyingId] = useState<number | null>(null)
  const [replyText, setReplyText]   = useState('')
  const [sending, setSending]       = useState(false)

  const load = useCallback(async (p = page, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await notificationsAPI.getAll(p)
      setItems(res.data); setPages(res.pages); setTotal(res.total); setUnread(res.unread_count)
    } catch {
      if (!silent) toast.error('Unable to load notifications.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [page])

  useEffect(() => { load(page) }, [page])

  // Poll for new notifications in the background so the list stays live.
  useEffect(() => {
    const id = setInterval(() => load(page, true), REFRESH_MS)
    return () => clearInterval(id)
  }, [page, load])

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsAPI.markRead(id)
      setItems(it => it.map(n => n.id === id ? { ...n, is_read: true } : n))
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

  const handleSendReply = async (id: number) => {
    if (!replyText.trim()) return toast.error('Write a reply first')
    setSending(true)
    try {
      const updated = await notificationsAPI.reply(id, replyText.trim())
      setItems(it => it.map(n => n.id === id ? updated : n))
      setReplyingId(null)
      setReplyText('')
      toast.success('Reply sent')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to send reply')
    } finally { setSending(false) }
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title="Admin Notifications"
        subtitle={`${total} notification${total !== 1 ? 's' : ''} · ${unread} unread`}
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => load(page)}
              className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-white/10 transition-colors"
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

      {loading ? <TableSkeleton cols={1} rows={6} /> : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet"
          subtitle="New feedback, event submissions, contact messages and club activity will appear here." />
      ) : (
        <>
          <div className="space-y-2">
            {items.map(n => {
              const meta = TYPE_META[n.type] ?? TYPE_META.system
              return (
                <div key={n.id} className={`card p-4 transition-all ${n.is_read ? 'opacity-70' : ''}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                    onKeyDown={e => { if (e.key === 'Enter' && !n.is_read) handleMarkRead(n.id) }}
                    className="w-full text-left flex items-start gap-3 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                      style={{ background: meta.gradient }}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-semibold truncate">{n.title}</p>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />}
                      </div>
                      <p className="text-surface-400 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-surface-500 text-[11px] mt-1.5">{formatTime(n.created_at)}</p>
                    </div>
                  </div>

                  {n.admin_reply ? (
                    <div className="mt-3 ml-12 rounded-lg p-3"
                      style={{ background: 'rgba(200,30,69,0.08)', border: '1px solid rgba(200,30,69,0.2)' }}>
                      <p className="text-primary-300 text-[11px] font-semibold mb-1">Your reply</p>
                      <p className="text-surface-300 text-xs leading-relaxed">{n.admin_reply}</p>
                    </div>
                  ) : n.can_reply ? (
                    replyingId === n.id ? (
                      <div className="mt-3 ml-12 space-y-2">
                        <textarea
                          className="input min-h-[70px] resize-none text-xs"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Write a reply…"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleSendReply(n.id)} disabled={sending}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
                            {sending && <Loader2 className="w-3 h-3 animate-spin" />} Send Reply
                          </button>
                          <button type="button" onClick={() => { setReplyingId(null); setReplyText('') }}
                            className="btn-secondary text-xs px-3 py-1.5">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setReplyingId(n.id); setReplyText('') }}
                        className="mt-2 ml-12 text-primary-300 text-xs font-medium hover:text-primary-200 transition-colors">
                        Reply
                      </button>
                    )
                  ) : null}
                </div>
              )
            })}
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}
    </div>
  )
}