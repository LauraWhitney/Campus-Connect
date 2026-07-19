import { useEffect, useState, useMemo } from 'react'
import { Calendar, Trash2, Users, Search, BarChart2, User, UserCheck, UserX, Loader2, CheckCircle2, XCircle, History } from 'lucide-react'
import { eventsAPI } from '../../api/admin'
import type { Event, ApprovalHistoryEntry } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'

// Locked only once a decision has actually been made — a never-reviewed
// ("pending") event must stay approvable/rejectable even past its date,
// or it would get stuck forever with no way to resolve it.
function isLockedPastEvent(event: Event) {
  const isPast = event.date < new Date().toISOString().split('T')[0]
  return isPast && event.approval_status !== 'pending'
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

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

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red',
}
const APPROVAL_TABS = [
  { label: 'All',      value: '' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function EventsPage() {
  const [events, setEvents]             = useState<Event[]>([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(1)
  const [pages, setPages]               = useState(1)
  const [total, setTotal]               = useState(0)
  const [query, setQuery]               = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [rsvpTarget, setRsvpTarget]     = useState<Event | null>(null)
  const [rsvpData, setRsvpData]         = useState<any>(null)
  const [rsvpLoading, setRsvpLoading]   = useState(false)
  const [rsvpActionLoading, setRsvpActionLoading] = useState<number | null>(null)
  const [attendanceTarget, setAttendanceTarget] = useState<Event | null>(null)
  const [attendanceData, setAttendanceData]     = useState<any>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<Event | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [historyTarget, setHistoryTarget]   = useState<Event | null>(null)
  const [historyData, setHistoryData]       = useState<ApprovalHistoryEntry[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const load = async (p = page, approval = approvalFilter) => {
    setLoading(true)
    try {
      const res = await eventsAPI.getAll(p, approval)
      setEvents(res.data); setPages(res.pages); setTotal(res.total)
    } catch { toast.error('Unable to load events.') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); load(1, approvalFilter) }, [approvalFilter])
  useEffect(() => { load(page, approvalFilter) }, [page])

  const results = useMemo(() => {
    if (!query.trim()) return events
    const q = query.toLowerCase()
    return events.filter(e =>
      e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    )
  }, [events, query])

  const handleApprove = async (event: Event) => {
    setReviewLoading(true)
    try {
      await eventsAPI.approveEvent(event.id)
      toast.success(`"${event.title}" approved`)
      load(page)
    } catch { toast.error('Failed to approve event') }
    finally { setReviewLoading(false) }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setReviewLoading(true)
    try {
      await eventsAPI.rejectEvent(rejectTarget.id, rejectReason)
      toast.success(`"${rejectTarget.title}" rejected`)
      setRejectTarget(null); setRejectReason('')
      load(page)
    } catch { toast.error('Failed to reject event') }
    finally { setReviewLoading(false) }
  }

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

  const openHistory = async (event: Event) => {
    setHistoryTarget(event)
    setHistoryData(null)
    setHistoryLoading(true)
    try {
      const data = await eventsAPI.getApprovalHistory(event.id)
      setHistoryData(data)
    } catch { toast.error('Failed to load approval history') }
    finally { setHistoryLoading(false) }
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
          <p className="font-medium text-white text-sm">{row.title}</p>
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
    {
      key: 'approval_status', label: 'Approval',
      render: (v: string, row: Event) => (
        <div>
          <span className={APPROVAL_BADGE[v] ?? 'badge-surface'}>{v}</span>
          {v === 'rejected' && row.rejection_reason && (
            <p className="text-red-300/80 text-[10px] mt-1 max-w-[140px] truncate" title={row.rejection_reason}>
              {row.rejection_reason}
            </p>
          )}
          {row.reviewer_name && (
            <p className="text-surface-500 text-[10px] mt-1">
              By {row.reviewer_name}{row.reviewed_at ? ` · ${formatDateTime(row.reviewed_at)}` : ''}
            </p>
          )}
        </div>
      ),
    },
    { key: 'venue', label: 'Venue', render: (v: string) => <span className="text-sm text-surface-300 truncate max-w-[120px] block">{v}</span> },
    {
      key: 'rsvp_count', label: 'RSVPs',
      render: (v: number, row: Event) => (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white">{v ?? 0}</span>
          {row.capacity && <span className="text-surface-400 text-xs">/ {row.capacity}</span>}
        </div>
      ),
    },
    {
      key: 'actions', label: '',
      render: (_: any, row: Event) => {
        const locked = isLockedPastEvent(row)
        const lockedTitle = locked ? "This event's date has passed — approval status is locked" : undefined
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => handleApprove(row)} disabled={reviewLoading || locked || row.approval_status === 'approved'}
              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
              title={lockedTitle ?? (row.approval_status === 'approved' ? 'Already approved' : 'Approve event')}>
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={() => { setRejectTarget(row); setRejectReason('') }} disabled={reviewLoading || locked || row.approval_status === 'rejected'}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
              title={lockedTitle ?? (row.approval_status === 'rejected' ? 'Already rejected' : 'Reject event')}>
              <XCircle className="w-4 h-4" />
            </button>
            <button onClick={() => openHistory(row)}
              className="p-1.5 rounded-lg text-surface-400 hover:bg-white/10 transition-colors" title="Approval history">
              <History className="w-4 h-4" />
            </button>
            <button onClick={() => openRsvps(row)}
              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-500/10 transition-colors" title="View RSVPs">
              <Users className="w-4 h-4" />
            </button>
            <button onClick={() => openAttendance(row)}
              className="p-1.5 rounded-lg text-surface-400 hover:bg-white/10 transition-colors" title="Attendance">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader title="Events" subtitle={`${total} total events`} />

      <div className="flex flex-wrap gap-2 mb-4">
        {APPROVAL_TABS.map(tab => (
          <button key={tab.value} type="button" onClick={() => setApprovalFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              approvalFilter === tab.value
                ? 'text-white'
                : 'text-surface-400 border border-surface-600/40 hover:border-primary-500/40 hover:text-primary-400'
            }`}
            style={approvalFilter === tab.value ? { background: 'linear-gradient(90deg,#c81e45,#d4af37)' } : {}}>
            {tab.label}
          </button>
        ))}
      </div>

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
                  <div key={u.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-700/30 border border-surface-600/40 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{u.user_name}</p>
                      <p className="text-xs text-surface-500 truncate">{u.user_email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      u.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                      u.status === 'rejected' ? 'bg-red-500/15 text-red-300 border-red-500/30' :
                      'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>{u.status}</span>
                    {u.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApproveRsvp(u.id)}
                          disabled={rsvpActionLoading === u.id}
                          className="p-1.5 rounded text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Approve">
                          {rsvpActionLoading === u.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleRejectRsvp(u.id)}
                          disabled={rsvpActionLoading === u.id}
                          className="p-1.5 rounded text-red-500 hover:bg-red-500/10 transition-colors" title="Reject">
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
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                  <p className="text-2xl font-bold text-indigo-300">{attendanceData.rsvp_count}</p>
                  <p className="text-xs text-indigo-400 mt-1">RSVPs</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-2xl font-bold text-emerald-300">{attendanceData.checked_in_count}</p>
                  <p className="text-xs text-emerald-500 mt-1">Checked In</p>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      )}

      {/* Approval History Modal */}
      {historyTarget && (
        <Modal open={!!historyTarget} onClose={() => setHistoryTarget(null)}
          title={`Approval History — ${historyTarget.title}`} size="md">
          {historyLoading ? (
            <div className="py-8 text-center text-surface-500 text-sm">Loading history…</div>
          ) : !historyData || historyData.length === 0 ? (
            <p className="text-surface-500 text-sm text-center py-6">No approval decisions recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {historyData.map(h => (
                <div key={h.id} className="p-3 rounded-lg bg-surface-700/30 border border-surface-600/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className={h.action === 'approve' ? 'badge-green' : 'badge-red'}>
                      {h.previous_status} → {h.new_status}
                    </span>
                    <span className="text-surface-500 text-xs whitespace-nowrap">{formatDateTime(h.reviewed_at)}</span>
                  </div>
                  <p className="text-surface-400 text-xs mt-1.5">By {h.reviewed_by ?? 'Unknown admin'}</p>
                  {h.reason && <p className="text-surface-300 text-xs mt-1">"{h.reason}"</p>}
                </div>
              ))}
            </div>
          )}
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

      {/* Reject event modal — reason is passed to the owner in their notification */}
      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason('') }}
        title="Reject Event" size="sm">
        <p className="text-surface-300 text-sm mb-3">
          Reject <span className="text-white font-medium">{rejectTarget?.title}</span>? The organiser will be
          notified and can edit and resubmit it.
        </p>
        <label htmlFor="rejectReason" className="block text-xs text-surface-400 mb-1.5 font-medium">
          Reason (optional, shown to the organiser)
        </label>
        <textarea id="rejectReason" className="input min-h-[80px] resize-none mb-5"
          value={rejectReason} onChange={e => setRejectReason(e.target.value)}
          placeholder="e.g. Venue already booked at that time — please choose another slot." />
        <div className="flex gap-3">
          <button onClick={() => { setRejectTarget(null); setRejectReason('') }} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleReject} disabled={reviewLoading}
            className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 disabled:opacity-40">
            Reject Event
          </button>
        </div>
      </Modal>
    </div>
  )
}