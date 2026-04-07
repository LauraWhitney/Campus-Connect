import { useEffect, useState, useMemo } from 'react'
import { ShoppingBag, Plus, Tag, Loader2, Mail, Search } from 'lucide-react'
import { marketplaceAPI } from '../../api/marketplace'
import type { MarketplaceItem, ItemCategory, ItemCondition } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const CATEGORIES: string[] = ['All', 'Books', 'Electronics', 'Clothing', 'Stationery', 'Accommodation', 'Other']
const CONDITIONS: ItemCondition[] = ['New', 'Like New', 'Good', 'Fair']

const COND_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  New:       { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  'Like New':{ bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  Good:      { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
  Fair:      { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
}

const CAT_GRADIENT: Record<string, string> = {
  Books:         'linear-gradient(135deg,#3b82f6,#6366f1)',
  Electronics:   'linear-gradient(135deg,#6366f1,#8b5cf6)',
  Clothing:      'linear-gradient(135deg,#ec4899,#8b5cf6)',
  Stationery:    'linear-gradient(135deg,#f59e0b,#ef4444)',
  Accommodation: 'linear-gradient(135deg,#10b981,#06b6d4)',
  Other:         'linear-gradient(135deg,#8b5cf6,#a855f7)',
}

function ItemCard({ item }: { item: MarketplaceItem }) {
  const gradient = CAT_GRADIENT[item.category] ?? CAT_GRADIENT.Other
  const cond = COND_STYLE[item.condition] ?? COND_STYLE.Fair

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-fade-in"
      style={{ background: '#1e1b4b' }}>
      <div className="h-1.5" style={{ background: gradient }} />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-white text-sm leading-snug line-clamp-2">{item.title}</h3>
            <p className="text-indigo-300 text-xs mt-0.5">{item.seller.name}</p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0"
            style={{ background: cond.bg, color: cond.text, borderColor: cond.border }}>
            {item.condition}
          </span>
        </div>

        <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{item.description}</p>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: gradient }}>
            <Tag className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-indigo-300 text-xs">{item.category}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="font-display text-xl font-bold text-white">
            KES {Number(item.price).toLocaleString()}
          </span>
          <a href={`mailto:${item.seller.email}?subject=Re: ${item.title}`}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Mail className="w-3.5 h-3.5" /> Contact
          </a>
        </div>
      </div>
    </div>
  )
}

function CreateItemModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', price: '', condition: 'Good' as ItemCondition, category: 'Books' as ItemCategory })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNaN(Number(form.price)) || Number(form.price) <= 0) return toast.error('Enter a valid price')
    setLoading(true)
    try {
      await marketplaceAPI.create({ ...form, price: Number(form.price) as any })
      toast.success('Item listed!')
      onCreated()
      onClose()
      setForm({ title: '', description: '', price: '', condition: 'Good', category: 'Books' })
    } catch { toast.error('Failed to list item') }
    finally { setLoading(false) }
  }

  const lbl = 'block text-xs text-slate-600 mb-1.5 font-medium'
  return (
    <Modal open={open} onClose={onClose} title="List an Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="it-title" className={lbl}>Item Title</label>
          <input id="it-title" className="input" value={form.title} onChange={set('title')} required placeholder="e.g. Calculus Textbook" maxLength={200} /></div>
        <div><label htmlFor="it-desc" className={lbl}>Description</label>
          <textarea id="it-desc" className="input min-h-[80px] resize-none" value={form.description} onChange={set('description')} required placeholder="Describe the item…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="it-price" className={lbl}>Price (KES)</label>
            <input id="it-price" className="input" type="number" min="1" value={form.price} onChange={set('price')} required placeholder="0" /></div>
          <div><label htmlFor="it-cond" className={lbl}>Condition</label>
            <select id="it-cond" className="input" value={form.condition} onChange={set('condition')}>
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select></div>
        </div>
        <div><label htmlFor="it-cat" className={lbl}>Category</label>
          <select id="it-cat" className="input" value={form.category} onChange={set('category')}>
            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} List Item
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function MarketplacePage() {
  const [items, setItems]       = useState<MarketplaceItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery]       = useState('')

  const results = useMemo(() => {
    let list = filter === 'All' ? items : items.filter(i => i.category === filter)
    if (query.trim()) { const q = query.toLowerCase(); list = list.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) }
    return list
  }, [items, filter, query])

  const load = async () => {
    setLoading(true)
    try { const res = await marketplaceAPI.getAll(); setItems(res.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader title="Student Marketplace"
        subtitle={`${results.length} item${results.length !== 1 ? 's' : ''} available`}
        action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> List Item</button>}
      />
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input className="input pl-10" placeholder="Search items…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <FilterBar options={CATEGORIES} active={filter} onChange={setFilter} />
      {loading ? <LoadingGrid /> : results.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No items listed" subtitle="Be the first to list something!"
          action={<button onClick={() => setShowModal(true)} className="btn-primary">List an Item</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(i => <ItemCard key={i._id} item={i} />)}
        </div>
      )}
      <CreateItemModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
    </div>
  )
}
