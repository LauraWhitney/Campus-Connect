import { useEffect, useState, useMemo } from 'react'
import { ShoppingBag, Trash2, Search, CheckCircle2, RotateCcw } from 'lucide-react'
import { marketplaceAPI } from '../../api/admin'
import type { MarketplaceItem } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function MarketplacePage() {
  const [items, setItems]               = useState<MarketplaceItem[]>([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(1)
  const [pages, setPages]               = useState(1)
  const [total, setTotal]               = useState(0)
  const [query, setQuery]               = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MarketplaceItem | null>(null)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await marketplaceAPI.getAll(p)
      setItems(res.data); setPages(res.pages); setTotal(res.total)
    } catch { toast.error('Unable to load items.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const results = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(i =>
      i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) ||
      i.seller.name.toLowerCase().includes(q)
    )
  }, [items, query])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await marketplaceAPI.delete(deleteTarget.id)
      toast.success('Item deleted.')
      setDeleteTarget(null)
      load(page)
    } catch { toast.error('Failed to delete item.') }
  }

  const handleMarkSold = async (item: MarketplaceItem) => {
    try {
      const updated = await marketplaceAPI.markSold(item.id)
      setItems(it => it.map(i => i.id === item.id ? updated : i))
      toast.success('Marked as sold.')
    } catch { toast.error('Failed.') }
  }

  const handleMarkUnsold = async (item: MarketplaceItem) => {
    try {
      const updated = await marketplaceAPI.markUnsold(item.id)
      setItems(it => it.map(i => i.id === item.id ? updated : i))
      toast.success('Relisted.')
    } catch { toast.error('Failed.') }
  }

  const columns = [
    {
      key: 'title', label: 'Item',
      render: (_: any, row: MarketplaceItem) => (
        <div className="flex items-center gap-2">
          {row.images && row.images.length > 0 && (
            <img src={row.images[0]} alt={row.title}
              className="w-10 h-10 rounded object-cover shrink-0 border border-surface-200"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <div>
            <p className="font-medium text-surface-900 text-sm">{row.title}</p>
            <p className="text-surface-500 text-xs">{row.category} · {row.condition}</p>
            {row.contact && <p className="text-surface-400 text-xs">{row.contact}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'price', label: 'Price',
      render: (v: number) => <span className="font-semibold text-surface-900 text-sm">KES {Number(v).toLocaleString()}</span>,
    },
    { key: 'seller', label: 'Seller', render: (_: any, row: MarketplaceItem) => <span className="text-xs text-surface-600">{row.seller.name}</span> },
    {
      key: 'is_sold', label: 'Status',
      render: (v: boolean) => v
        ? <span className="badge badge-surface">Sold</span>
        : <span className="badge badge-green">Available</span>,
    },
    {
      key: 'actions', label: '',
      render: (_: any, row: MarketplaceItem) => (
        <div className="flex items-center gap-2">
          {!row.is_sold
            ? <button onClick={() => handleMarkSold(row)}
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Mark Sold">
                <CheckCircle2 className="w-4 h-4" />
              </button>
            : <button onClick={() => handleMarkUnsold(row)}
                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="Relist">
                <RotateCcw className="w-4 h-4" />
              </button>
          }
          <button onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Marketplace" subtitle={`${total} listings`} />

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        <input className="input pl-9 w-full max-w-sm" placeholder="Search listings…"
          value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="card">
        {loading ? <TableSkeleton cols={5} rows={8} /> :
          results.length === 0 ? <EmptyState icon={ShoppingBag} title="No listings found" /> :
          <Table columns={columns} data={results} />
        }
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Listing"
        message={`Delete "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
