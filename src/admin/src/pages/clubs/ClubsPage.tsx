import { useEffect, useState } from 'react'
import { UserCheck, Trash2, Users } from 'lucide-react'
import { clubsAPI } from '../../api/admin'
import type { Club } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'

const CATEGORY_EMOJI: Record<string, string> = {
  Academic: '📚', Sports: '⚽', Arts: '🎨', Religious: '✝️', Technology: '💻', Community: '🤝',
}

// Each category gets a gradient matching the student colour palette
const CATEGORY_GRADIENT: Record<string, string> = {
  Academic:   'linear-gradient(135deg,#3b82f6,#6366f1)',
  Sports:     'linear-gradient(135deg,#10b981,#06b6d4)',
  Arts:       'linear-gradient(135deg,#a855f7,#ec4899)',
  Religious:  'linear-gradient(135deg,#f59e0b,#ef4444)',
  Technology: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  Community:  'linear-gradient(135deg,#8b5cf6,#a855f7)',
}

export default function ClubsPage() {
  const [clubs, setClubs]     = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [pages, setPages]     = useState(1)
  const [total, setTotal]     = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await clubsAPI.getAll(p)
      setClubs(res.data); setPages(res.pages); setTotal(res.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await clubsAPI.delete(deleteTarget.id); toast.success('Club removed'); load(page) }
    catch { toast.error('Failed to remove club') }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Clubs Management" subtitle={`${total} club${total !== 1 ? 's' : ''} registered`} />

      {loading ? <TableSkeleton cols={5} rows={8} /> : clubs.length === 0 ? (
        <EmptyState icon={UserCheck} title="No clubs yet" subtitle="Clubs created by students will appear here." />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Club Name</th>
                <th className="th hidden sm:table-cell">Category</th>
                <th className="th hidden md:table-cell">President</th>
                <th className="th hidden md:table-cell"><Users className="w-3.5 h-3.5 inline mr-1" />Members</th>
                <th className="th hidden lg:table-cell">Contact</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map(club => (
                <tr key={club.id} className="table-row">
                  <td className="td font-medium text-white max-w-[180px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                        style={{ background: CATEGORY_GRADIENT[club.category] ?? CATEGORY_GRADIENT.Technology }}>
                        <span>{CATEGORY_EMOJI[club.category] ?? '🏫'}</span>
                      </div>
                      <span className="truncate">{club.name}</span>
                    </div>
                  </td>
                  <td className="td hidden sm:table-cell"><span className="badge-brand">{club.category}</span></td>
                  <td className="td text-slate-500 hidden md:table-cell">{club.president}</td>
                  <td className="td text-slate-700 font-medium hidden md:table-cell">{club.member_count}</td>
                  <td className="td text-slate-500 hidden lg:table-cell max-w-[160px] truncate">{club.email}</td>
                  <td className="td text-right">
                    <button type="button" onClick={() => setDeleteTarget(club)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`Delete club: ${club.name}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Club" message={`Permanently delete "${deleteTarget?.name}" and remove all members?`} danger />
    </div>
  )
}
