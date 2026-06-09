import { useEffect, useState, useMemo } from 'react'
import { Calendar, Trash2, Users, Search, BarChart2, User, UserCheck, UserX, Loader2 } from 'lucide-react'
import { eventsAPI } from '../../api/admin'
import type { Event } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'

const CAT_BADGE: Record<string, string> = {
  Academic:            'badge-blue',
  Sports:              'badge-green',
  Cultural:            'badge-brand',
  Spiritual:           'badge-yellow',
  Career:              'badge-purple',
  Social:              'badge-surface',
  Convocation:         'badge-blue',
  'Staff Development': 'badge-surface',
}

export default function EventsPage() {
  const [events, setEvents]             = useState<Event[]>([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(1)
  const [pages, setPages]               = useState(1)
  const [total, setTotal]               = useState(0)
  const [query, setQuery]               = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [rsvpTarget, setRsvpTarget]     = useState<Event | null>(null)
  const [rsvpData, setRsvpData]         = useState<any>(null)
  const [rsvpLoading, setRsvpLoading]   = useState(false)
  const [rsvpActionLoading, setRsvpActionLoading] = useState<number | null>(null)
  const [attendanceTarget, setAttendanceTarget] = useState<Event | null>(null)
  const [attendanceData, setAttendanceData]     = useState<any>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await eventsAPI.getAll(p)
      setEvents(res.data); setPages(res.pages); setTotal(res.total)
    } catch { toast.error('Unable to load events.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const results = useMemo(() => {
    if (!query.trim()) return events
    const q = query.toLowerCase()
    return events.filter(e =>
      e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    )
  }, [events, query])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await eventsAPI.delete(deleteTarget.id)
      toast.success('Event deleted.')
      setDeleteTarget(null)
      load(page)
    } catch { toast.error('Failed to delete event.') }
  }

  const openRsvps = async (event: Event) => {
    setRsvpTarget(event)
    setRsvpData(null)
    setRsvpLoading(true)
    try {
      const data = await eventsAPI.getRsvps(event.id)
      setRsvpData(data)
    } catch { toast.error('Failed to load RSVPs') }
    finally { setRsvpLoading(false) }
  }

  const openAttendance = async (event: Event) => {
    setAttendanceTarget(event)
    setAttendanceData(null)
    setAttendanceLoading(true)
    try {
      const data = await eventsAPI.getAttendance(event.id)
      setAttendanceData(data)
    } catch { toast.error('Failed to load attendance') }
    finally { setAttendanceLoading(false) }
  }

  const handleApproveRsvp = async (rsvpId: number) => {
    if (!rsvpTarget) return
    setRsvpActionLoading(rsvpId)
    try {
      await eventsAPI.approveRsvp(rsvpTarget.id, rsvpId)
      toast.success('RSVP approved!')
      const data = await eventsAPI.getRsvps(rsvpTarget.id)
      setRsvpData(data)
    } catch { toast.error('Failed to approve RSVP') }
    finally { setRsvpActionLoading(null) }
  }

  const handleRejectRsvp = async (rsvpId: number) => {
    if (!rsvpTarget) return
    setRsvpActionLoading(rsvpId)
    try {
      await eventsAPI.rejectRsvp(rsvpTarget.id, rsvpId)
      toast.success('RSVP rejected.')
      const data = await eventsAPI.getRsvps(rsvpTarget.id)
      setRsvpData(data)
    } catch { toast.error('Failed to reject RSVP') }
    finally { setRsvpActionLoading(null) }
  }

  const columns = [
    {
      key: 'title', label: 'Event',
      render: (_: any, row: Event) => (
        <div>
          <p className="font-medium text-surface-900 text-sm">{row.title}</p>
          <p className="text-surface-500 text-xs">{row.date} · {row.time}</p>
          {row.creator && (
            <p className="text-surface-400 text-xs flex items-center gap-1 mt-0.5">
              <User className="w-2.5 h-2.5" /> {row.creator.name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'category', label: 'Category',
      render: (v: string) => <span className={`badge ${CAT_BADGE[v] ?? 'badge-surface'}`}>{v}</span>,
    },
    { key: 'venue', label: 'Venue', render: (v: string) => <span className="text-sm text-surface-600 truncate max-w-[120px] block">{v}</span> },
    {
      key: 'rsvp_count', label: 'RSVPs',
      render: (v: number, row: Event) => (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-surface-900">{v ?? 0}</span>
          {row.capacity && <span className="text-surface-400 text-xs">/ {row.capacity}</span>}
        </div>
      ),
    },
    {
      key: 'actions', label: '',
      render: (_: any, row: Event) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openRsvps(row)}
            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="View RSVPs">
            <Users className="w-4 h-4" />
          </button>
          <button onClick={() => openAttendance(row)}
            className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors" title="Attendance">
            <BarChart2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Events" subtitle={`${total} total events`} />

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        <input className="input pl-9 w-full max-w-sm" placeholder="Search events…"
          value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="card">
        {loading ? <TableSkeleton cols={5} rows={8} /> :
          results.length === 0 ? <EmptyState icon={Calendar} title="No events found" /> :
          <Table columns={columns} data={results} />
        }
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />

      {/* RSVPs Modal */}
      {rsvpTarget && (
        <Modal open={!!rsvpTarget} onClose={() => setRsvpTarget(null)} title={`RSVPs — ${rsvpTarget.title}`} size="md">
          {rsvpLoading ? (
            <div className="py-8 text-center text-surface-500 text-sm">Loading RSVPs…</div>
          ) : rsvpData ? (
            <div>
              <p className="text-surface-500 text-sm mb-3">{rsvpData.approved_count} approved / {rsvpData.pending_count} pending total</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {rsvpData.requests?.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-50 border border-surface-200 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{u.user_name}</p>
                      <p className="text-xs text-surface-500 truncate">{u.user_email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      u.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      u.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{u.status}</span>
                    {u.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApproveRsvp(u.id)}
                          disabled={rsvpActionLoading === u.id}
                          className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition-colors" title="Approve">
                          {rsvpActionLoading === u.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleRejectRsvp(u.id)}
                          disabled={rsvpActionLoading === u.id}
                          className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors" title="Reject">
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Modal>
      )}

      {/* Attendance Modal */}
      {attendanceTarget && (
        <Modal open={!!attendanceTarget} onClose={() => { setAttendanceTarget(null); setAttendanceData(null) }}
          title={`Attendance — ${attendanceTarget.title}`} size="md">
          {attendanceLoading ? (
            <div className="py-8 text-center text-surface-500 text-sm">Loading attendance…</div>
          ) : attendanceData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                  <p className="text-2xl font-bold text-indigo-700">{attendanceData.rsvp_count}</p>
                  <p className="text-xs text-indigo-500 mt-1">RSVPs</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{attendanceData.checked_in_count}</p>
                  <p className="text-xs text-emerald-500 mt-1">Checked In</p>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event"
        message={`Delete "${deleteTarget?.title}"? This will also remove all RSVPs.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
