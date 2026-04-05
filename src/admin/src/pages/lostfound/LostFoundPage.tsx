import { useEffect, useState } from 'react'
import { Search, CheckCircle } from 'lucide-react'
import { lostFoundAPI } from '../../api/admin'
import type { LostFoundItem } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'

const STATUS_BADGE: Record<string, string> = { Lost: 'badge-red', Found: 'badge-green', Claimed: 'badge-navy' }

export default function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [claimTarget, setClaimTarget] = useState<LostFoundItem | null>(null)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await lostFoundAPI.getAll(p)
      setItems(res.data); setPages(res.pages); setTotal(res.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const handleClaim = async () => {
    if (!claimTarget) return
    try { await lostFoundAPI.markClaimed(claimTarget.id); toast.success('Marked as claimed'); load(page) }
    catch { toast.error('Failed to update item') }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Lost & Found Management" subtitle={`${total} active report${total !== 1 ? 's' : ''}`} />

      {loading ? <TableSkeleton cols={6} rows={8} /> : items.length === 0 ? (
        <EmptyState icon={Search} title="No reports yet" />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-navy-700/40">
                <th className="th">Item</th>
                <th className="th">Status</th>
                <th className="th hidden sm:table-cell">Location</th>
                <th className="th hidden md:table-cell">Date</th>
                <th className="th hidden md:table-cell">Reported By</th>
                <th className="th hidden lg:table-cell">Contact</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="table-row">
                  <td className="td font-medium text-white max-w-[160px] truncate">{item.title}</td>
                  <td className="td"><span className={STATUS_BADGE[item.status] ?? 'badge-navy'}>{item.status}</span></td>
                  <td className="td text-navy-400 hidden sm:table-cell max-w-[140px] truncate">{item.location}</td>
                  <td className="td text-navy-400 hidden md:table-cell">
                    {new Date(item.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="td text-navy-400 hidden md:table-cell">{item.reporter?.name ?? 'Anonymous'}</td>
                  <td className="td text-navy-400 hidden lg:table-cell max-w-[140px] truncate">{item.contact}</td>
                  <td className="td text-right">
                    {!item.is_claimed && (
                      <button onClick={() => setClaimTarget(item)}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Mark claimed">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog open={!!claimTarget} onClose={() => setClaimTarget(null)} onConfirm={handleClaim}
        title="Mark as Claimed" message={`Mark "${claimTarget?.title}" as claimed/resolved?`} />
    </div>
  )
}
