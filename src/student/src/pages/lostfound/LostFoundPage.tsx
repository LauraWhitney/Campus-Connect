import { useEffect, useState } from 'react'
import { Search, MapPin, Phone, Plus, Loader2, CalendarDays, CheckCircle2, Eye } from 'lucide-react'
import { lostFoundAPI } from '../../api/lostFound'
import type { LostFoundItem, ItemStatus } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const FILTERS = ['All', 'Lost', 'Found', 'Claimed']

const STATUS_STYLE: Record<string, { gradient: string; badge: { bg: string; text: string; border: string } }> = {
  Lost:    { gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)', badge: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' } },
  Found:   { gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', badge: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' } },
  Claimed: { gradient: 'linear-gradient(135deg,#64748b,#475569)',  badge: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' } },
}

function LostFoundCard({
  item, currentUserId, onClaim, onMarkFound,
}: {
  item: LostFoundItem
  currentUserId?: string
  onClaim: (id: string) => void
  onMarkFound: (id: string) => void
}) {
  const s          = STATUS_STYLE[item.status] ?? STATUS_STYLE.Lost
  const isReporter = item.reportedBy && String(item.reportedBy._id) === currentUserId

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-fade-in"
      style={{ background: '#1e1b4b' }}>
      <div className="h-1.5" style={{ background: s.gradient }} />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-white text-sm leading-snug flex-1">{item.title}</h3>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0"
            style={{ background: s.badge.bg, color: s.badge.text, borderColor: s.badge.border }}>
            {item.status}
          </span>
        </div>

        <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{item.description}</p>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-300 text-xs">
            <MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>{new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs">
            <Phone className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{item.contact}</span>
          </div>
        </div>

        {/* Claimed info */}
        {item.isClaimed && item.claimer && (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs pt-1 border-t border-white/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Claimed by {item.claimer.name}
            {item.claimedAt && ` · ${new Date(item.claimedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-1">
          {/* Anyone can claim an unclaimed item */}
          {!item.isClaimed && (
            <button onClick={() => onClaim(item._id)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Claimed
            </button>
          )}
          {/* Reporter can update Lost → Found */}
          {isReporter && item.status === 'Lost' && (
            <button onClick={() => onMarkFound(item._id)}
              className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
              <Eye className="w-3.5 h-3.5" /> Mark as Found
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReportModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', status: 'Lost' as ItemStatus,
    location: '', date: '', contact: '',
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
      setForm({ title: '', description: '', status: 'Lost', location: '', date: '', contact: '' })
    } catch { toast.error('Failed to submit report') }
    finally { setLoading(false) }
  }

  const lbl = 'block text-xs text-slate-600 mb-1.5 font-medium'
  return (
    <Modal open={open} onClose={onClose} title="Report Lost / Found Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="lf-title" className={lbl}>Item Name</label>
          <input id="lf-title" className="input" value={form.title} onChange={set('title')} required placeholder="e.g. Blue water bottle" maxLength={200} /></div>
        <div><label htmlFor="lf-desc" className={lbl}>Description</label>
          <textarea id="lf-desc" className="input min-h-[80px] resize-none" value={form.description} onChange={set('description')} required placeholder="Describe the item in detail" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="lf-status" className={lbl}>Status</label>
            <select id="lf-status" className="input" value={form.status} onChange={set('status')}>
              <option value="Lost">Lost</option><option value="Found">Found</option>
            </select></div>
          <div><label htmlFor="lf-date" className={lbl}>Date</label>
            <input id="lf-date" className="input" type="date" value={form.date} onChange={set('date')} required /></div>
        </div>
        <div><label htmlFor="lf-loc" className={lbl}>Location on Campus</label>
          <input id="lf-loc" className="input" value={form.location} onChange={set('location')} required placeholder="e.g. CUEA Library, Gate B" maxLength={200} /></div>
        <div><label htmlFor="lf-contact" className={lbl}>Contact Info</label>
          <input id="lf-contact" className="input" value={form.contact} onChange={set('contact')} required placeholder="Phone or CUEA email" maxLength={100} /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Report
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function LostFoundPage() {
  const { user }                    = useAuth()
  const [items, setItems]           = useState<LostFoundItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('All')
  const [showModal, setShowModal]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await lostFoundAPI.getAll(1, filter === 'All' ? undefined : filter)
      setItems(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const handleClaim = async (id: string) => {
    try {
      const updated = await lostFoundAPI.claim(id)
      setItems(it => it.map(i => i._id === id ? updated : i))
      toast.success('Item marked as claimed!')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update item')
    }
  }

  const handleMarkFound = async (id: string) => {
    try {
      const updated = await lostFoundAPI.markFound(id)
      setItems(it => it.map(i => i._id === id ? updated : i))
      toast.success('Item status updated to Found.')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update item')
    }
  }

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader title="Lost & Found"
        subtitle={`${items.filter(i => !i.isClaimed).length} active report${items.filter(i => !i.isClaimed).length !== 1 ? 's' : ''}`}
        action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Report Item</button>}
      />
      <FilterBar options={FILTERS} active={filter} onChange={setFilter} />
      {loading ? <LoadingGrid /> : items.length === 0 ? (
        <EmptyState icon={Search} title="No reports found" subtitle="Nothing lost or found right now."
          action={<button onClick={() => setShowModal(true)} className="btn-primary">Report an Item</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(i => (
            <LostFoundCard
              key={i._id} item={i}
              currentUserId={user?._id}
              onClaim={handleClaim}
              onMarkFound={handleMarkFound}
            />
          ))}
        </div>
      )}
      <ReportModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
    </div>
  )
}
