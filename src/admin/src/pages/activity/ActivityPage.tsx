import { useEffect, useState, useMemo } from 'react'
import { Activity, Search, User, LogIn, UserPlus, Trash2, Edit3, AlertCircle } from 'lucide-react'
import { activityAPI } from '../../api/admin'
import type { ActivityLog } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination } from '../../components/ui/index'
import toast from 'react-hot-toast'

const ACTION_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  'user.register': { icon: <UserPlus className="w-3.5 h-3.5" />, color: 'badge-green', label: 'Register' },
  'user.login': { icon: <LogIn className="w-3.5 h-3.5" />, color: 'badge-brand', label: 'Login' },
  'user.delete': { icon: <Trash2 className="w-3.5 h-3.5" />, color: 'badge-red', label: 'Delete' },
  'role.update': { icon: <Edit3 className="w-3.5 h-3.5" />, color: 'badge-purple', label: 'Role' },
}

function getActionMeta(action: string) {
  return ACTION_META[action] ?? {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    color: 'badge-surface',
    label: action,
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ACTION_FILTERS = [
  { value: '', label: 'All Actions' },
  { value: 'user.register', label: 'Registrations' },
  { value: 'user.login', label: 'Logins' },
  { value: 'user.delete', label: 'Deletions' },
  { value: 'role.update', label: 'Role Changes' },
]

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const [query, setQuery] = useState('')

  const load = async (p: number, action: string) => {
    setLoading(true)
    try {
      const res = await activityAPI.getAll(p, action)
      setLogs(res.data)
      setPages(res.pages)
      setTotal(res.total)
    } catch {
      toast.error('Unable to load activity logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    load(1, actionFilter)
  }, [actionFilter])

  useEffect(() => {
    load(page, actionFilter)
  }, [page])

  const results = useMemo(() => {
    if (!query.trim()) return logs
    const q = query.toLowerCase()
    return logs.filter(
      l =>
        l.user_email?.toLowerCase().includes(q) ||
        l.detail?.toLowerCase().includes(q) ||
        l.ip_address?.includes(q)
    )
  }, [logs, query])

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        title="Activity Logs"
        subtitle={`${total} total action${total !== 1 ? 's' : ''} recorded`}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
          <input
            className="input pl-10"
            placeholder="Search by email, detail or IP…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Accessibility Fix: Added label for select */}
        <div className="sm:w-48">
          <label htmlFor="actionFilter" className="sr-only">
            Filter activity by action
          </label>

          <select
            id="actionFilter"
            className="input sm:w-48"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            {ACTION_FILTERS.map(f => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton cols={5} rows={10} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity found"
          subtitle={
            query
              ? `No results for "${query}"`
              : 'Actions will appear here as users interact with the platform.'
          }
        />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-surface-700/40">
                <th className="th">Action</th>
                <th className="th">User</th>
                <th className="th hidden md:table-cell">Detail</th>
                <th className="th hidden lg:table-cell">IP Address</th>
                <th className="th">Time</th>
              </tr>
            </thead>
            <tbody>
              {results.map(log => {
                const meta = getActionMeta(log.action)
                return (
                  <tr key={log.id} className="table-row">
                    <td className="td">
                      <span className={`${meta.color} flex items-center gap-1.5 w-fit`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>

                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-primary-400" />
                        </div>
                        <span className="text-surface-200 text-xs truncate max-w-[140px]">
                          {log.user_email ?? 'Anonymous'}
                        </span>
                      </div>
                    </td>

                    <td className="td hidden md:table-cell text-surface-400 max-w-[200px] truncate">
                      {log.detail ?? '—'}
                    </td>

                    <td className="td hidden lg:table-cell text-surface-500 font-mono text-xs">
                      {log.ip_address ?? '—'}
                    </td>

                    <td className="td text-surface-400 text-xs whitespace-nowrap">
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