import { useEffect, useState, useMemo } from 'react'
import { Users, Trash2, Search, MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { clubsAPI } from '../../api/admin'
import type { Club } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red',
}
const APPROVAL_TABS = [
  { label: 'All',      value: '' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function ClubsPage() {
  const [clubs, setClubs]               = useState<Club[]>([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(1)
  const [pages, setPages]               = useState(1)
  const [total, setTotal]               = useState(0)
  const [query, setQuery]               = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null)
  const [membersTarget, setMembersTarget] = useState<Club | null>(null)
  const [membersData, setMembersData]     = useState<any>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [rejectTarget, setRejectTarget]   = useState<Club | null>(null)
  const [rejectReason, setRejectReason]   = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const load = async (p = page, approval = approvalFilter) => {
    setLoading(true)
    try {
      const res = await clubsAPI.getAll(p, approval)
      setClubs(res.data); setPages(res.pages); setTotal(res.total)
    } catch { toast.error('Unable to load clubs.') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); load(1, approvalFilter) }, [approvalFilter])
  useEffect(() => { load(page, approvalFilter) }, [page])

  const handleApprove = async (club: Club) => {
    setReviewLoading(true)
    try {
      await clubsAPI.approveClub(club.id)
      toast.success(`"${club.name}" approved`)
      load(page)
    } catch { toast.error('Failed to approve club') }
    finally { setReviewLoading(false) }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setReviewLoading(true)
    try {
      await clubsAPI.rejectClub(rejectTarget.id, rejectReason)
      toast.success(`"${rejectTarget.name}" rejected`)
      setRejectTarget(null); setRejectReason('')
      load(page)
    } catch { toast.error('Failed to reject club') }
    finally { setReviewLoading(false) }
  }

  const results = useMemo(() => {
    if (!query.trim()) return clubs
    const q = query.toLowerCase()
    return clubs.filter(c =>
      c.name.toLowerCase().includes(q) || c.president.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    )
  }, [clubs, query])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await clubsAPI.delete(deleteTarget.id)
      toast.success('Club deleted.')
      setDeleteTarget(null)
      load(page)
    } catch { toast.error('Failed to delete club.') }
  }

  const openMembers = async (club: Club) => {
    setMembersTarget(club)
    setMembersData(null)
    setMembersLoading(true)
    try {
      const data = await clubsAPI.getMembers(club.id)
      setMembersData(data)
    } catch { toast.error('Failed to load members') }
    finally { setMembersLoading(false) }
  }

  const columns = [
    {
      key: 'name', label: 'Club',
      render: (_: any, row: Club) => (
        <div>
          <p className="font-medium text-white text-sm">{row.name}</p>
          <p className="text-surface-500 text-xs">{row.category}</p>
          {row.registration_number && <p className="text-surface-400 text-xs">Reg: {row.registration_number}</p>}
        </div>
      ),
    },
    { key: 'president', label: 'President', render: (v: string) => <span className="text-sm text-surface-200">{v}</span> },
    {
      key: 'approval_status', label: 'Approval',
      render: (v: string, row: Club) => (
        <div>
          <span className={APPROVAL_BADGE[v] ?? 'badge-surface'}>{v}</span>
          {v === 'rejected' && row.rejection_reason && (
            <p className="text-red-300/80 text-[10px] mt-1 max-w-[140px] truncate" title={row.rejection_reason}>
              {row.rejection_reason}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'member_count', label: 'Members',
      render: (v: number, row: Club) => (
        <button onClick={() => openMembers(row)}
          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-300 font-semibold text-sm transition-colors">
          <Users className="w-3.5 h-3.5" /> {v}
        </button>
      ),
    },
    {
      key: 'meeting_location', label: 'Location',
      render: (v: string) => v ? (
        <div className="flex items-center gap-1 text-surface-300 text-xs">
          <MapPin className="w-3 h-3" /> {v}
        </div>
      ) : <span className="text-surface-400 text-xs">—</span>,
    },
    {
      key: 'actions', label: '',
      render: (_: any, row: Club) => (
        <div className="flex items-center gap-2">
          {row.approval_status === 'pending' && (
            <>
              <button onClick={() => handleApprove(row)} disabled={reviewLoading}
                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40" title="Approve club">
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button onClick={() => { setRejectTarget(row); setRejectReason('') }} disabled={reviewLoading}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40" title="Reject club">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Clubs & Societies" subtitle={`${total} registered clubs`} />

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
        <input className="input pl-9 w-full max-w-sm" placeholder="Search clubs…"
          value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="card">
        {loading ? <TableSkeleton cols={5} rows={8} /> :
          results.length === 0 ? <EmptyState icon={Users} title="No clubs found" /> :
          <Table columns={columns} data={results} />
        }
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />

      {/* Members Modal */}
      {membersTarget && (
        <Modal open={!!membersTarget} onClose={() => setMembersTarget(null)}
          title={`Members — ${membersTarget.name}`} size="md">
          {membersLoading ? (
            <div className="py-8 text-center text-surface-500 text-sm">Loading members…</div>
          ) : membersData ? (
            <div>
              <p className="text-surface-500 text-sm mb-3">{membersData.member_count} approved · {membersData.pending_count} pending</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {membersData.requests?.filter((r:any)=>r.status==="approved").map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-700/30 border border-surface-600/40">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <span className="text-indigo-300 text-xs font-bold">{u.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      <p className="text-xs text-surface-500">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Club"
        message={`Delete "${deleteTarget?.name}"? All members will be removed.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        danger
      />

      {/* Reject club modal — reason is passed to the owner in their notification */}
      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason('') }}
        title="Reject Club" size="sm">
        <p className="text-surface-300 text-sm mb-3">
          Reject <span className="text-white font-medium">{rejectTarget?.name}</span>? The registrant will be notified.
        </p>
        <label htmlFor="clubRejectReason" className="block text-xs text-surface-400 mb-1.5 font-medium">
          Reason (optional, shown to the registrant)
        </label>
        <textarea id="clubRejectReason" className="input min-h-[80px] resize-none mb-5"
          value={rejectReason} onChange={e => setRejectReason(e.target.value)}
          placeholder="e.g. A club with a very similar name/purpose already exists." />
        <div className="flex gap-3">
          <button onClick={() => { setRejectTarget(null); setRejectReason('') }} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleReject} disabled={reviewLoading}
            className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 disabled:opacity-40">
            Reject Club
          </button>
        </div>
      </Modal>
    </div>
  )
}
