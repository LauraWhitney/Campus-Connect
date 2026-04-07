import { useEffect, useState } from 'react'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { marketplaceAPI } from '../../api/admin'
import type { MarketplaceItem } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'

const COND_BADGE: Record<string, string> = {
  New: 'badge-green', 'Like New': 'badge-green', Good: 'badge-brand', Fair: 'badge-surface',
}

export default function MarketplacePage() {
  const [items, setItems]     = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [pages, setPages]     = useState(1)
  const [total, setTotal]     = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<MarketplaceItem | null>(null)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await marketplaceAPI.getAll(p)
      setItems(res.data); setPages(res.pages); setTotal(res.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await marketplaceAPI.delete(deleteTarget.id); toast.success('Listing removed'); load(page) }
    catch { toast.error('Failed to remove listing') }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Marketplace Management" subtitle={`${total} listing${total !== 1 ? 's' : ''} total`} />

      {loading ? <TableSkeleton cols={6} rows={8} /> : items.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No listings yet" subtitle="Student listings will appear here." />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Item</th>
                <th className="th hidden sm:table-cell">Category</th>
                <th className="th">Price</th>
                <th className="th hidden md:table-cell">Condition</th>
                <th className="th hidden md:table-cell">Seller</th>
                <th className="th hidden lg:table-cell">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="table-row">
                  <td className="td font-medium text-white max-w-[180px] truncate">{item.title}</td>
                  <td className="td hidden sm:table-cell"><span className="badge-surface">{item.category}</span></td>
                  <td className="td font-semibold" style={{ color: '#6366f1' }}>
                    KES {Number(item.price).toLocaleString()}
                  </td>
                  <td className="td hidden md:table-cell">
                    <span className={COND_BADGE[item.condition] ?? 'badge-surface'}>{item.condition}</span>
                  </td>
                  <td className="td text-slate-500 hidden md:table-cell max-w-[120px] truncate">{item.seller.name}</td>
                  <td className="td hidden lg:table-cell">
                    {item.is_sold ? <span className="badge-surface">Sold</span> : <span className="badge-green">Available</span>}
                  </td>
                  <td className="td text-right">
                    <button type="button" onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${item.title}`}>
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
        title="Remove Listing" message={`Remove "${deleteTarget?.title}" from the marketplace?`} danger />
    </div>
  )
}
