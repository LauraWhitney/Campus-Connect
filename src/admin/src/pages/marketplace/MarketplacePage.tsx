import { useEffect, useState } from 'react'
import { ShoppingBag, Trash2, CheckCircle, RotateCcw } from 'lucide-react'
import { marketplaceAPI } from '../../api/admin'
import type { MarketplaceItem } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'

const COND_BADGE: Record<string, string> = {
  New: 'badge-green', 'Like New': 'badge-green', Good: 'badge-brand', Fair: 'badge-surface',
}

export default function MarketplacePage() {
  const [items, setItems]             = useState<MarketplaceItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)
  const [pages, setPages]             = useState(1)
  const [total, setTotal]             = useState(0)
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

  const handleMarkSold = async (item: MarketplaceItem) => {
    try {
      const updated = await marketplaceAPI.markSold(item.id)
      setItems(it => it.map(i => i.id === item.id ? updated : i))
      toast.success(`"${item.title}" marked as sold`)
    } catch { toast.error('Failed to mark as sold') }
  }

  const handleMarkUnsold = async (item: MarketplaceItem) => {
    try {
      const updated = await marketplaceAPI.markUnsold(item.id)
      setItems(it => it.map(i => i.id === item.id ? updated : i))
      toast.success(`"${item.title}" relisted as available`)
    } catch { toast.error('Failed to relist item') }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Marketplace Management"
        subtitle={`${total} listing${total !== 1 ? 's' : ''} · ${items.filter(i => i.is_sold).length} sold`} />

      {loading ? <TableSkeleton cols={7} rows={8} /> : items.length === 0 ? (
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
                <th className="th hidden lg:table-cell">Buyer</th>
                <th className="th hidden lg:table-cell">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="table-row">
                  <td className="td font-medium text-white max-w-[160px] truncate">{item.title}</td>
                  <td className="td hidden sm:table-cell"><span className="badge-surface">{item.category}</span></td>
                  <td className="td font-semibold" style={{ color: '#6366f1' }}>
                    KES {Number(item.price).toLocaleString()}
                  </td>
                  <td className="td hidden md:table-cell">
                    <span className={COND_BADGE[item.condition] ?? 'badge-surface'}>{item.condition}</span>
                  </td>
                  <td className="td text-slate-500 hidden md:table-cell max-w-[110px] truncate">{item.seller.name}</td>
                  <td className="td hidden lg:table-cell">
                    {item.buyer
                      ? <span className="text-slate-400 text-xs">{item.buyer.name}</span>
                      : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="td hidden lg:table-cell">
                    {item.is_sold
                      ? (
                        <div>
                          <span className="badge-surface">Sold</span>
                          {item.sold_at && (
                            <p className="text-slate-500 text-[10px] mt-0.5">
                              {new Date(item.sold_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>
                      )
                      : <span className="badge-green">Available</span>}
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      {!item.is_sold ? (
                        <button type="button" onClick={() => handleMarkSold(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Mark as sold">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => handleMarkUnsold(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Relist as available">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label={`Remove ${item.title}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
