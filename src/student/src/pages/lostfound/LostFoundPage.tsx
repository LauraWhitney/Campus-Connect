import { useEffect, useState } from 'react'
import { Search, MapPin, Phone, Plus, Loader2, CalendarDays } from 'lucide-react'
import { lostFoundAPI } from '../../api/lostFound'
import type { LostFoundItem, ItemStatus } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const FILTERS = ['All', 'Lost', 'Found']

const STATUS_STYLES: Record<string, string> = {
  Lost: 'bg-red-500/20 text-red-300 border-red-500/30',
  Found: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Claimed: 'bg-surface-600/60 text-surface-300 border-surface-500/40',
}

function LostFoundCard({ item, onClaim }: { item: LostFoundItem; onClaim: (id: string) => void }) {
  return (
    <div className="card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-semibold text-white text-sm leading-snug">{item.title}</h3>
        <span className={`badge border shrink-0 ${STATUS_STYLES[item.status]}`}>{item.status}</span>
      </div>

      <p className="text-surface-300 text-xs line-clamp-2 leading-relaxed">{item.description}</p>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-surface-400 text-xs">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{item.location}</span>
        </div>

        <div className="flex items-center gap-2 text-surface-400 text-xs">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span>{new Date(item.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>

        <div className="flex items-center gap-2 text-surface-400 text-xs">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{item.contact}</span>
        </div>
      </div>

      {!item.isClaimed && (
        <button
          onClick={() => onClaim(item._id)}
          className="w-full py-2.5 rounded-xl text-xs font-semibold border border-primary-500/40 text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 transition-all"
        >
          Mark as Claimed / Resolved
        </button>
      )}
    </div>
  )
}

function ReportModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'Lost' as ItemStatus,
    location: '',
    date: '',
    contact: ''
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await lostFoundAPI.create(form)
      toast.success('Report submitted!')
      onCreated()
      onClose()
    } catch {
      toast.error('Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report Lost / Found Item">
      <form onSubmit={handleSubmit} className="space-y-4  bg-blue-700 p-5 rounded-xl">

        <div>
          <label htmlFor="item-title" className="block text-xs text-surface-300 mb-1.5">
            Item Name
          </label>
          <input
            id="item-title"
            className="input"
            value={form.title}
            onChange={set('title')}
            required
            placeholder="e.g. Blue water bottle"
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
            placeholder="Describe the item in detail"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">

          <div>
            <label htmlFor="item-status" className="block text-xs text-surface-300 mb-1.5">
              Status
            </label>
            <select
              id="item-status"
              className="input"
              value={form.status}
              onChange={set('status')}
            >
              <option value="Lost">Lost</option>
              <option value="Found">Found</option>
            </select>
          </div>

          <div>
            <label htmlFor="item-date" className="block text-xs text-surface-300 mb-1.5">
              Date
            </label>
            <input
              id="item-date"
              className="input"
              type="date"
              value={form.date}
              onChange={set('date')}
              required
            />
          </div>

        </div>

        <div>
          <label htmlFor="item-location" className="block text-xs text-surface-300 mb-1.5">
            Location
          </label>
          <input
            id="item-location"
            className="input"
            value={form.location}
            onChange={set('location')}
            required
            placeholder="Where was it lost/found?"
          />
        </div>

        <div>
          <label htmlFor="item-contact" className="block text-xs text-surface-300 mb-1.5">
            Contact Info
          </label>
          <input
            id="item-contact"
            className="input"
            value={form.contact}
            onChange={set('contact')}
            required
            placeholder="Phone or email"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 transition-all">
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Submit Report
          </button>
        </div>

      </form>
    </Modal>
  )
}

export default function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await lostFoundAPI.getAll(1, filter === 'All' ? undefined : filter)
      setItems(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const handleClaim = async (id: string) => {
    try {
      await lostFoundAPI.markClaimed(id)
      setItems(items => items.filter(i => i._id !== id))
      toast.success('Item marked as claimed')
    } catch {
      toast.error('Failed to update item')
    }
  }

  return (
    <div className="page-wrapper max-w-5xl mx-auto">

      <PageHeader
        title="Lost & Found"
        subtitle={`${items.length} active report${items.length !== 1 ? 's' : ''}`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
            style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}
          >
            <Plus className="w-4 h-4" /> Report Item
          </button>
        }
      />

      <FilterBar options={FILTERS} active={filter} onChange={setFilter} />

      {loading ? (
        <LoadingGrid />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No reports found"
          subtitle="Nothing lost or found right now."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
            >
              Report an Item
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(i => (
            <LostFoundCard key={i._id} item={i} onClaim={handleClaim} />
          ))}
        </div>
      )}

      <ReportModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />

    </div>
  )
}