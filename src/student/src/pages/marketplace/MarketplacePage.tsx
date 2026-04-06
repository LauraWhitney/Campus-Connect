import { useEffect, useState } from 'react'
import { ShoppingBag, Plus, Tag, Loader2, Mail } from 'lucide-react'
import { marketplaceAPI } from '../../api/marketplace'
import type { MarketplaceItem, ItemCategory, ItemCondition } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const CATEGORIES: string[] = ['All', 'Books', 'Electronics', 'Clothing', 'Stationery', 'Accommodation', 'Other']
const CONDITIONS: ItemCondition[] = ['New', 'Like New', 'Good', 'Fair']

const CONDITION_COLOR: Record<string, string> = {
  New: 'badge-green',
  'Like New': 'badge-green',
  Good: 'badge-brand',
  Fair: 'badge-surface'
}

function ItemCard({ item }: { item: MarketplaceItem }) {
  return (
    <div className="card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-white text-sm leading-snug line-clamp-2">
            {item.title}
          </h3>
          <p className="text-surface-400 text-xs mt-0.5">{item.seller.name}</p>
        </div>

        <span className={`${CONDITION_COLOR[item.condition] || 'badge-surface'} shrink-0`}>
          {item.condition}
        </span>
      </div>

      <p className="text-surface-300 text-xs line-clamp-2 leading-relaxed">
        {item.description}
      </p>

      <div className="flex items-center gap-2">
        <span className="badge-surface">
          <Tag className="w-3 h-3" />{item.category}
        </span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-surface-700/40">
        <span className="font-display text-xl font-semibold text-primary-400">
          KES {Number(item.price).toLocaleString()}
        </span>

        <a
          href={`mailto:${item.seller.email}?subject=Re: ${item.title} on Campus Connect`}
          className="flex items-center gap-1.5 text-xs text-surface-300 hover:text-primary-400 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" /> Contact
        </a>
      </div>
    </div>
  )
}

function CreateItemModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {

  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'Good' as ItemCondition,
    category: 'Books' as ItemCategory
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      return toast.error('Enter a valid price')
    }

    setLoading(true)

    try {
      await marketplaceAPI.create({
        ...form,
        price: Number(form.price) as unknown as import('../../types').MarketplaceItem['price']
      })

      toast.success('Item listed!')
      onCreated()
      onClose()

    } catch {
      toast.error('Failed to list item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="List an Item">

      <form onSubmit={handleSubmit} className="space-y-4  bg-blue-700 p-5 rounded-xl">

        <div>
          <label htmlFor="item-title" className="block text-xs text-surface-300 mb-1.5">
            Item Title
          </label>
          <input
            id="item-title"
            className="input"
            value={form.title}
            onChange={set('title')}
            required
            placeholder="e.g. Calculus Textbook 3rd Ed."
          />
        </div>

        <div>
          <label htmlFor="item-description" className="block text-xs text-surface-300 mb-1.5">
            Description
          </label>
          <textarea
            id="item-description"
            className="input min-h-[80px] resize-none"
            value={form.description}
            onChange={set('description')}
            required
            placeholder="Describe the item, any damage, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">

          <div>
            <label htmlFor="item-price" className="block text-xs text-surface-300 mb-1.5">
              Price (KES)
            </label>

            <input
              id="item-price"
              className="input"
              type="number"
              min="0"
              value={form.price}
              onChange={set('price')}
              required
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="item-condition" className="block text-xs text-surface-300 mb-1.5">
              Condition
            </label>

            <select
              id="item-condition"
              className="input"
              value={form.condition}
              onChange={set('condition')}
            >
              {CONDITIONS.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>

        <div>
          <label htmlFor="item-category" className="block text-xs text-surface-300 mb-1.5">
            Category
          </label>

          <select
            id="item-category"
            className="input"
            value={form.category}
            onChange={set('category')}
          >
            {CATEGORIES.filter(c => c !== 'All').map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            List Item
          </button>

        </div>

      </form>

    </Modal>
  )
}

export default function MarketplacePage() {

  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await marketplaceAPI.getAll(1, filter === 'All' ? undefined : filter)
      setItems(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filter])

  return (
    <div className="page-wrapper max-w-5xl mx-auto">

      <PageHeader
        title="Student Marketplace"
        subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} available`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
            style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}
          >
            <Plus className="w-4 h-4" /> List Item
          </button>
        }
      />

      <FilterBar
        options={CATEGORIES}
        active={filter}
        onChange={setFilter}
      />

      {loading ? (
        <LoadingGrid />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No items listed"
          subtitle="Be the first to list something!"
          action={
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
            >
              List an Item
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(i => (
            <ItemCard key={i._id} item={i} />
          ))}
        </div>
      )}

      <CreateItemModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={load}
      />

    </div>
  )
}