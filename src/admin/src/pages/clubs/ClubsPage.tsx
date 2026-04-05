import { useEffect, useState } from 'react'
import { UserCheck, Trash2, Users } from 'lucide-react'
import { clubsAPI } from '../../api/admin'
import type { Club } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
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
        <EmptyState icon={UserCheck} title="No clubs yet" />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-navy-700/40">
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
                  <td className="td font-medium text-white max-w-[180px] truncate">{club.name}</td>
                  <td className="td hidden sm:table-cell"><span className="badge-gold">{club.category}</span></td>
                  <td className="td text-navy-400 hidden md:table-cell">{club.president}</td>
                  <td className="td text-navy-300 hidden md:table-cell">{club.member_count}</td>
                  <td className="td text-navy-400 hidden lg:table-cell max-w-[160px] truncate">{club.email}</td>
                  <td className="td text-right">
                    <button
                      type="button" // <-- Prevent default form behavior
                      onClick={() => setDeleteTarget(club)}
                      className="p-1.5 rounded-lg text-navy-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label={`Delete club: ${club.name}`} // <-- Accessibility fix
                    >
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Club"
        message={`Permanently delete "${deleteTarget?.name}" and remove all members?`}
        danger
      />
    </div>
  )
}