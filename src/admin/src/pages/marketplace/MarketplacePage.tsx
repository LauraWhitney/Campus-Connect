import { useEffect, useState } from 'react'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { marketplaceAPI } from '../../api/admin'
import type { MarketplaceItem } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'

const COND_BADGE: Record<string, string> = { New: 'badge-green', 'Like New': 'badge-green', Good: 'badge-gold', Fair: 'badge-navy' }

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
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
        <EmptyState icon={ShoppingBag} title="No listings yet" />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-navy-700/40">
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
                  <td className="td hidden sm:table-cell"><span className="badge-navy">{item.category}</span></td>
                  <td className="td text-gold-400 font-semibold">KES {Number(item.price).toLocaleString()}</td>
                  <td className="td hidden md:table-cell"><span className={COND_BADGE[item.condition] ?? 'badge-navy'}>{item.condition}</span></td>
                  <td className="td text-navy-400 hidden md:table-cell max-w-[120px] truncate">{item.seller.name}</td>
                  <td className="td hidden lg:table-cell">
                    {item.is_sold
                      ? <span className="badge-navy">Sold</span>
                      : <span className="badge-green">Available</span>}
                  </td>
                  <td className="td text-right">
                    <button
                      type="button" // Added type to fix warning
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg text-navy-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label={`Remove ${item.title}`} // Added accessible name
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
        title="Remove Listing"
        message={`Remove "${deleteTarget?.title}" from the marketplace?`}
        danger
      />
    </div>
  )
}