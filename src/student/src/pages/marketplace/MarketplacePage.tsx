import { useEffect, useState, useMemo, useRef } from 'react'
import { ShoppingBag, Plus, Tag, Loader2, Mail, Search, CheckCircle2, RotateCcw, Trash2, ImagePlus, Phone } from 'lucide-react'
import { marketplaceAPI, uploadImage } from '../../api/marketplace'
import type { MarketplaceItem, ItemCategory, ItemCondition } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const CATEGORIES: string[] = [
  'All', 'Books', 'Electronics', 'Clothing', 'Stationery',
  'Accommodation', 'Notes/Handouts', 'Lab Equipment', 'Hostel Items', 'Other',
]
const CONDITIONS: ItemCondition[] = ['New', 'Like New', 'Good', 'Fair']

const COND_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  New:        { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  'Like New': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  Good:       { bg: '#fdf3d6', text: '#660019', border: '#fae3a3' },
  Fair:       { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
}
const CAT_GRADIENT: Record<string, string> = {
  Books: 'linear-gradient(135deg,#3b82f6,#c81e45)', Electronics: 'linear-gradient(135deg,#c81e45,#d4af37)',
  Clothing: 'linear-gradient(135deg,#ec4899,#d4af37)', Stationery: 'linear-gradient(135deg,#f59e0b,#ef4444)',
  Accommodation: 'linear-gradient(135deg,#10b981,#06b6d4)', 'Notes/Handouts': 'linear-gradient(135deg,#0ea5e9,#c81e45)',
  'Lab Equipment': 'linear-gradient(135deg,#14b8a6,#3b82f6)', 'Hostel Items': 'linear-gradient(135deg,#d4af37,#ec4899)',
  Other: 'linear-gradient(135deg,#d4af37,#a855f7)',
}

function ItemCard({ item, currentUserId, onMarkSold, onMarkUnsold, onDelete }: {
  item: MarketplaceItem
  currentUserId?: string
  onMarkSold: (id: string) => void
  onMarkUnsold: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [loading, setLoading]       = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const gradient = CAT_GRADIENT[item.category] ?? CAT_GRADIENT.Other
  const cond     = COND_STYLE[item.condition] ?? COND_STYLE.Fair
  const isMySelling = item.seller._id === currentUserId

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-fade-in ${item.isSold ? 'opacity-70' : ''}`}
      style={{ background: '#2e000b' }}>
      <div className="h-1.5" style={{ background: gradient }} />
      {/* Item photo */}
      {item.images && item.images.length > 0 && (
        <div className="h-32 overflow-hidden">
          <img src={item.images[0]} alt={item.title}
            className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-white text-sm leading-snug line-clamp-2">{item.title}</h3>
            <p className="text-indigo-300 text-xs mt-0.5">
              {item.seller.name}
              {item.isSold && item.buyer && <span className="text-slate-500"> → sold to {item.buyer.name}</span>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
              style={{ background: cond.bg, color: cond.text, borderColor: cond.border }}>{item.condition}</span>
            {item.isSold && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-300 border border-slate-600">Sold</span>
            )}
            {isMySelling && (
              <button onClick={async () => { setDeleteLoading(true); await onDelete(item._id); setDeleteLoading(false) }}
                disabled={deleteLoading} title="Delete listing"
                className="p-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
                {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{item.description}</p>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: gradient }}>
            <Tag className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-indigo-300 text-xs">{item.category}</span>
          {item.soldAt && (
            <span className="text-slate-500 text-xs ml-auto">
              Sold {new Date(item.soldAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* Contact info */}
        {item.contact && !item.isSold && !isMySelling && (
          <div className="flex items-center gap-2 text-indigo-300 text-xs">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{item.contact}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="font-display text-xl font-bold text-white">
            KES {Number(item.price).toLocaleString()}
          </span>
          {!item.isSold ? (
            <div className="flex items-center gap-2">
              {isMySelling && (
                <button onClick={() => { setLoading(true); onMarkSold(item._id) }} disabled={loading}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Mark Sold
                </button>
              )}
              {!isMySelling && (
                <a href={`mailto:${item.seller.email}?subject=Re: ${item.title}`}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(200,30,69,0.2)', color: '#f5cd6b', border: '1px solid rgba(200,30,69,0.3)' }}>
                  <Mail className="w-3.5 h-3.5" /> Contact
                </a>
              )}
            </div>
          ) : (
            isMySelling && (
              <button onClick={() => { setLoading(true); onMarkUnsold(item._id) }} disabled={loading}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(200,30,69,0.1)', color: '#f5cd6b', border: '1px solid rgba(200,30,69,0.2)' }}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Relist
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function CreateItemModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading]         = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '', description: '', price: '',
    condition: 'Good' as ItemCondition, category: 'Books' as ItemCategory,
    contact: '',
  })
  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setUploadedUrl(url)
      toast.success('Image uploaded!')
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed')
      setPreviewUrl(null)
    } finally { setUploading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNaN(Number(form.price)) || Number(form.price) <= 0) return toast.error('Enter a valid price')
    setLoading(true)
    try {
      await marketplaceAPI.create({
        ...form,
        price: Number(form.price) as any,
        images: uploadedUrl ? [uploadedUrl] : [],
      })
      toast.success('Item listed!')
      onCreated()
      onClose()
      setForm({ title: '', description: '', price: '', condition: 'Good', category: 'Books', contact: '' })
      setPreviewUrl(null); setUploadedUrl(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to list item')
    } finally { setLoading(false) }
  }

  const lbl = 'block text-xs text-slate-600 mb-1.5 font-medium'
  return (
    <Modal open={open} onClose={onClose} title="List an Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo upload */}
        <div>
          <label className={lbl}>Photo <span className="text-slate-400">(optional)</span></label>
          <div onClick={() => fileRef.current?.click()}
            className="w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors overflow-hidden"
            style={{ borderColor: previewUrl ? 'transparent' : '#fae3a3', background: previewUrl ? 'transparent' : '#fefaf0' }}>
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : <ImagePlus className="w-5 h-5 text-indigo-400" />}
                <span className="text-indigo-500 text-xs">{uploading ? 'Uploading…' : 'Click to upload photo'}</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>

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
        <div><label htmlFor="it-contact" className={lbl}>Contact Info <span className="text-slate-400">(phone / WhatsApp)</span></label>
          <input id="it-contact" className="input" value={form.contact} onChange={set('contact')} placeholder="+254…" maxLength={100} /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading || uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} List Item
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function MarketplacePage() {
  const { user }                  = useAuth()
  const [items, setItems]         = useState<MarketplaceItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery]         = useState('')

  const results = useMemo(() => {
    let list = filter === 'All' ? items : items.filter(i => i.category === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    }
    return list
  }, [items, filter, query])

  const load = async () => {
    setLoading(true)
    try { const res = await marketplaceAPI.getAll(); setItems(res.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleMarkSold = async (id: string) => {
    try {
      const updated = await marketplaceAPI.markSold(id)
      setItems(it => it.map(i => i._id === id ? updated : i))
      toast.success('Item marked as sold!')
    } catch (err: any) { toast.error(err?.response?.data?.detail || 'Failed to mark as sold') }
  }

  const handleMarkUnsold = async (id: string) => {
    try {
      const updated = await marketplaceAPI.markUnsold(id)
      setItems(it => it.map(i => i._id === id ? updated : i))
      toast.success('Item relisted as available.')
    } catch { toast.error('Failed to relist item') }
  }

  const handleDelete = async (id: string) => {
    try {
      await marketplaceAPI.delete(id)
      setItems(it => it.filter(i => i._id !== id))
      toast.success('Listing deleted.')
    } catch (err: any) { toast.error(err?.response?.data?.detail || 'Failed to delete') }
  }

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader title="Student Marketplace"
        subtitle={`${results.filter(i => !i.isSold).length} item${results.filter(i => !i.isSold).length !== 1 ? 's' : ''} available`}
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
          {results.map(i => (
            <ItemCard key={i._id} item={i} currentUserId={user?._id}
              onMarkSold={handleMarkSold} onMarkUnsold={handleMarkUnsold} onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      <CreateItemModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
    </div>
  )
}