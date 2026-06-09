import { useEffect, useState, useMemo } from 'react'
import { Users, Trash2, Search, MapPin } from 'lucide-react'
import { clubsAPI } from '../../api/admin'
import type { Club } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function ClubsPage() {
  const [clubs, setClubs]               = useState<Club[]>([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(1)
  const [pages, setPages]               = useState(1)
  const [total, setTotal]               = useState(0)
  const [query, setQuery]               = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null)
  const [membersTarget, setMembersTarget] = useState<Club | null>(null)
  const [membersData, setMembersData]     = useState<any>(null)
  const [membersLoading, setMembersLoading] = useState(false)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await clubsAPI.getAll(p)
      setClubs(res.data); setPages(res.pages); setTotal(res.total)
    } catch { toast.error('Unable to load clubs.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

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
          <p className="font-medium text-surface-900 text-sm">{row.name}</p>
          <p className="text-surface-500 text-xs">{row.category}</p>
          {row.registration_number && <p className="text-surface-400 text-xs">Reg: {row.registration_number}</p>}
        </div>
      ),
    },
    { key: 'president', label: 'President', render: (v: string) => <span className="text-sm text-surface-700">{v}</span> },
    {
      key: 'member_count', label: 'Members',
      render: (v: number, row: Club) => (
        <button onClick={() => openMembers(row)}
          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors">
          <Users className="w-3.5 h-3.5" /> {v}
        </button>
      ),
    },
    {
      key: 'meeting_location', label: 'Location',
      render: (v: string) => v ? (
        <div className="flex items-center gap-1 text-surface-600 text-xs">
          <MapPin className="w-3 h-3" /> {v}
        </div>
      ) : <span className="text-surface-400 text-xs">—</span>,
    },
    {
      key: 'actions', label: '',
      render: (_: any, row: Club) => (
        <button onClick={() => setDeleteTarget(row)}
          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Clubs & Societies" subtitle={`${total} registered clubs`} />

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
                  <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-50 border border-surface-200">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-indigo-700 text-xs font-bold">{u.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{u.name}</p>
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
    </div>
  )
}
