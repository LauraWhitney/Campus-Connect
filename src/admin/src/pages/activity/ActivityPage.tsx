import { useEffect, useState, useMemo } from 'react'
import {
  Activity, Search, User, LogIn, UserPlus, Trash2, Edit3,
  AlertCircle, Calendar, ShoppingBag, Users, MessageSquare, MapPin,
} from 'lucide-react'
import { activityAPI } from '../../api/admin'
import type { ActivityLog } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination } from '../../components/ui/index'
import toast from 'react-hot-toast'

// ── All action types — expanded to cover every new transaction ─
const ACTION_META: Record<string, {
  icon: React.ReactNode
  badgeCls: string
  label: string
  gradient: string
}> = {
  // Auth
  'user.register':          { icon: <UserPlus    className="w-3.5 h-3.5" />, badgeCls: 'badge-green',   label: 'Registered',        gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  'user.login':             { icon: <LogIn       className="w-3.5 h-3.5" />, badgeCls: 'badge-brand',   label: 'Login',             gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  'user.delete':            { icon: <Trash2      className="w-3.5 h-3.5" />, badgeCls: 'badge-red',     label: 'Deleted',           gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)' },
  'role.update':            { icon: <Edit3       className="w-3.5 h-3.5" />, badgeCls: 'badge-purple',  label: 'Role Updated',      gradient: 'linear-gradient(135deg,#8b5cf6,#a855f7)' },
  // Events
  'event.create':           { icon: <Calendar    className="w-3.5 h-3.5" />, badgeCls: 'badge-blue',    label: 'Event Created',     gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
  'event.delete':           { icon: <Trash2      className="w-3.5 h-3.5" />, badgeCls: 'badge-red',     label: 'Event Deleted',     gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)' },
  'event.rsvp_add':         { icon: <Calendar    className="w-3.5 h-3.5" />, badgeCls: 'badge-green',   label: 'RSVP\'d',           gradient: 'linear-gradient(135deg,#10b981,#3b82f6)' },
  'event.rsvp_cancel':      { icon: <Calendar    className="w-3.5 h-3.5" />, badgeCls: 'badge-yellow',  label: 'RSVP Cancelled',    gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  'event.checkin':          { icon: <Calendar    className="w-3.5 h-3.5" />, badgeCls: 'badge-green',   label: 'Checked In',        gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  // Marketplace
  'marketplace.list':       { icon: <ShoppingBag className="w-3.5 h-3.5" />, badgeCls: 'badge-brand',   label: 'Listed Item',       gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  'marketplace.sold':       { icon: <ShoppingBag className="w-3.5 h-3.5" />, badgeCls: 'badge-green',   label: 'Item Sold',         gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  'marketplace.unsold':     { icon: <ShoppingBag className="w-3.5 h-3.5" />, badgeCls: 'badge-yellow',  label: 'Relisted',          gradient: 'linear-gradient(135deg,#f59e0b,#8b5cf6)' },
  'marketplace.delete':     { icon: <Trash2      className="w-3.5 h-3.5" />, badgeCls: 'badge-red',     label: 'Listing Removed',   gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)' },
  // Clubs
  'club.create':            { icon: <Users       className="w-3.5 h-3.5" />, badgeCls: 'badge-brand',   label: 'Club Created',      gradient: 'linear-gradient(135deg,#8b5cf6,#a855f7)' },
  'club.join':              { icon: <Users       className="w-3.5 h-3.5" />, badgeCls: 'badge-green',   label: 'Joined Club',       gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  'club.leave':             { icon: <Users       className="w-3.5 h-3.5" />, badgeCls: 'badge-yellow',  label: 'Left Club',         gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  'club.delete':            { icon: <Trash2      className="w-3.5 h-3.5" />, badgeCls: 'badge-red',     label: 'Club Deleted',      gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)' },
  // Lost & Found
  'lostfound.report':       { icon: <MapPin      className="w-3.5 h-3.5" />, badgeCls: 'badge-yellow',  label: 'Item Reported',     gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  'lostfound.claim':        { icon: <MapPin      className="w-3.5 h-3.5" />, badgeCls: 'badge-green',   label: 'Item Claimed',      gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  'lostfound.found':        { icon: <MapPin      className="w-3.5 h-3.5" />, badgeCls: 'badge-blue',    label: 'Marked Found',      gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
  'lostfound.delete':       { icon: <Trash2      className="w-3.5 h-3.5" />, badgeCls: 'badge-red',     label: 'Report Removed',    gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)' },
  // Feedback
  'feedback.submit':        { icon: <MessageSquare className="w-3.5 h-3.5" />, badgeCls: 'badge-brand', label: 'Feedback Submitted', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  'feedback.status_update': { icon: <Edit3       className="w-3.5 h-3.5" />, badgeCls: 'badge-purple',  label: 'Status Updated',    gradient: 'linear-gradient(135deg,#8b5cf6,#a855f7)' },
  'feedback.delete':        { icon: <Trash2      className="w-3.5 h-3.5" />, badgeCls: 'badge-red',     label: 'Feedback Deleted',  gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)' },
}

function getMeta(action: string) {
  return ACTION_META[action] ?? {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    badgeCls: 'badge-surface', label: action,
    gradient: 'linear-gradient(135deg,#94a3b8,#64748b)',
  }
}

function formatTime(d: string) {
  return new Date(d).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── Filter options ─────────────────────────────────────
const ACTION_GROUPS = [
  { label: 'All Actions',    value: '' },
  { label: 'Auth',           value: 'user' },
  { label: 'Events',         value: 'event' },
  { label: 'Marketplace',    value: 'marketplace' },
  { label: 'Clubs',          value: 'club' },
  { label: 'Lost & Found',   value: 'lostfound' },
  { label: 'Feedback',       value: 'feedback' },
]

export default function ActivityPage() {
  const [logs, setLogs]                 = useState<ActivityLog[]>([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(1)
  const [pages, setPages]               = useState(1)
  const [total, setTotal]               = useState(0)
  const [groupFilter, setGroupFilter]   = useState('')
  const [query, setQuery]               = useState('')

  const load = async (p: number, group: string) => {
    setLoading(true)
    try {
      const res = await activityAPI.getAll(p, group)
      setLogs(res.data); setPages(res.pages); setTotal(res.total)
    } catch { toast.error('Unable to load activity logs.') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); load(1, groupFilter) }, [groupFilter])
  useEffect(() => { load(page, groupFilter) }, [page])

  const results = useMemo(() => {
    if (!query.trim()) return logs
    const q = query.toLowerCase()
    return logs.filter(l =>
      l.user_email?.toLowerCase().includes(q) ||
      l.detail?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.ip_address?.includes(q)
    )
  }, [logs, query])

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Activity Logs"
        subtitle={`${total} transaction${total !== 1 ? 's' : ''} recorded across all modules`} />

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input className="input pl-10" placeholder="Search by email, action or detail…"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="sm:w-52">
          <label htmlFor="groupFilter" className="sr-only">Filter by module</label>
          <select id="groupFilter" className="input" value={groupFilter}
            onChange={e => { setGroupFilter(e.target.value); setQuery('') }}>
            {ACTION_GROUPS.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <TableSkeleton cols={5} rows={12} /> : results.length === 0 ? (
        <EmptyState icon={Activity}
          title="No activity found"
          subtitle={query
            ? `No results for "${query}"`
            : 'User actions across all modules will appear here.'} />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Action</th>
                <th className="th">User</th>
                <th className="th hidden md:table-cell">Detail</th>
                <th className="th hidden lg:table-cell">IP Address</th>
                <th className="th">Time</th>
              </tr>
            </thead>
            <tbody>
              {results.map(log => {
                const meta = getMeta(log.action)
                return (
                  <tr key={log.id} className="table-row">
                    {/* Action badge */}
                    <td className="td">
                      <span className={`${meta.badgeCls} flex items-center gap-1.5 w-fit whitespace-nowrap`}>
                        {meta.icon}{meta.label}
                      </span>
                    </td>
                    {/* User */}
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: meta.gradient }}>
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-slate-700 text-xs truncate max-w-[140px]">
                          {log.user_email ?? 'Anonymous'}
                        </span>
                      </div>
                    </td>
                    {/* Detail */}
                    <td className="td hidden md:table-cell text-slate-500 max-w-[220px] truncate text-xs">
                      {log.detail ?? '—'}
                    </td>
                    {/* IP */}
                    <td className="td hidden lg:table-cell text-slate-400 font-mono text-xs">
                      {log.ip_address ?? '—'}
                    </td>
                    {/* Time */}
                    <td className="td text-slate-400 text-xs whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          {!query && <Pagination page={page} pages={pages} onChange={setPage} />}
        </>
      )}
    </div>
  )
}
