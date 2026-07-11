import { useEffect, useState } from 'react'
import { Search, CheckCircle, Eye } from 'lucide-react'
import { lostFoundAPI } from '../../api/admin'
import type { LostFoundItem } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'

const STATUS_BADGE: Record<string, string> = {
  Lost: 'badge-red', Found: 'badge-green', Claimed: 'badge-surface',
}
const STATUS_STRIPE: Record<string, string> = {
  Lost:    'border-l-4 border-l-red-400',
  Found:   'border-l-4 border-l-emerald-400',
  Claimed: 'border-l-4 border-l-slate-300',
}

export default function LostFoundPage() {
  const [items, setItems]             = useState<LostFoundItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)
  const [pages, setPages]             = useState(1)
  const [total, setTotal]             = useState(0)
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
    try {
      const updated = await lostFoundAPI.claim(claimTarget.id)
      setItems(it => it.map(i => i.id === claimTarget.id ? updated : i))
      toast.success('Marked as claimed')
    } catch { toast.error('Failed to update item') }
  }

  const handleMarkFound = async (item: LostFoundItem) => {
    try {
      const updated = await lostFoundAPI.markFound(item.id)
      setItems(it => it.map(i => i.id === item.id ? updated : i))
      toast.success(`"${item.title}" updated to Found`)
    } catch { toast.error('Failed to update item') }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Lost & Found Management"
        subtitle={`${total} report${total !== 1 ? 's' : ''} · ${items.filter(i => i.is_claimed).length} resolved`} />

      <div className="card">
        {loading ? <TableSkeleton cols={7} rows={8} /> : items.length === 0 ? (
          <EmptyState icon={Search} title="No reports yet" subtitle="Student reports will appear here." />
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-surface-700/40">
                <th className="th">Item</th>
                <th className="th">Status</th>
                <th className="th hidden sm:table-cell">Location</th>
                <th className="th hidden md:table-cell">Date</th>
                <th className="th hidden md:table-cell">Reporter</th>
                <th className="th hidden lg:table-cell">Claimed By</th>
                <th className="th hidden lg:table-cell">Contact</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className={`table-row ${STATUS_STRIPE[item.status] ?? ''}`}>
                  <td className="td font-medium text-white max-w-[140px] truncate">{item.title}</td>
                  <td className="td">
                    <span className={STATUS_BADGE[item.status] ?? 'badge-surface'}>{item.status}</span>
                  </td>
                  <td className="td text-surface-400 hidden sm:table-cell max-w-[130px] truncate">{item.location}</td>
                  <td className="td text-surface-400 hidden md:table-cell">
                    {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="td text-surface-400 hidden md:table-cell">{item.reporter?.name ?? 'Anonymous'}</td>
                  <td className="td hidden lg:table-cell">
                    {item.claimer
                      ? (
                        <div>
                          <span className="text-surface-500 text-xs">{item.claimer.name}</span>
                          {item.claimed_at && (
                            <p className="text-surface-300 text-[10px]">
                              {new Date(item.claimed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>
                      )
                      : <span className="text-surface-300 text-xs">—</span>}
                  </td>
                  <td className="td text-surface-400 hidden lg:table-cell max-w-[130px] truncate">{item.contact}</td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      {/* Lost → Found */}
                      {item.status === 'Lost' && (
                        <button onClick={() => handleMarkFound(item)}
                          className="p-1.5 rounded-lg text-surface-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Mark as Found">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Found → Claimed */}
                      {!item.is_claimed && (
                        <button onClick={() => setClaimTarget(item)}
                          className="p-1.5 rounded-lg text-surface-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Mark as Claimed">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      {!loading && items.length > 0 && <Pagination page={page} pages={pages} onChange={setPage} />}

      <ConfirmDialog open={!!claimTarget} onClose={() => setClaimTarget(null)} onConfirm={handleClaim}
        title="Mark as Claimed"
        message={`Mark "${claimTarget?.title}" as claimed? This will record you as the claimer.`} />
    </div>
  )
}
