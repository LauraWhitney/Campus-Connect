import { useEffect, useState } from 'react'
import { Users, Mail, CalendarDays, Loader2, Plus } from 'lucide-react'
import { clubsAPI } from '../../api/clubs'
import type { Club, ClubCategory } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const CATEGORIES: string[] = ['All', 'Academic', 'Sports', 'Arts', 'Religious', 'Technology', 'Community']
const CATEGORY_EMOJI: Record<string, string> = { Academic: '📚', Sports: '⚽', Arts: '🎨', Religious: '✝️', Technology: '💻', Community: '🤝' }

function ClubCard({ club, onJoin }: { club: Club; onJoin: (id: string) => void }) {
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    setLoading(true)
    try { await onJoin(club._id) } finally { setLoading(false) }
  }

  return (
    <div className="card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-surface-700/60 border border-surface-600/40 flex items-center justify-center shrink-0 text-2xl">
          {CATEGORY_EMOJI[club.category] || '🏫'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-white text-sm leading-snug">{club.name}</h3>
          <span className="badge-brand mt-1">{club.category}</span>
        </div>
      </div>

      <p className="text-surface-300 text-xs line-clamp-2 leading-relaxed">{club.description}</p>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-surface-400 text-xs">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>{club.memberCount} members · Led by {club.president}</span>
        </div>
        {club.meetingSchedule && (
          <div className="flex items-center gap-2 text-surface-400 text-xs">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{club.meetingSchedule}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-surface-400 text-xs">
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <a href={`mailto:${club.email}`} className="hover:text-primary-400 transition-colors truncate">{club.email}</a>
        </div>
      </div>

      <button
        type="button"
        onClick={handleJoin}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
          ${club.isMember
            ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 hover:bg-primary-500/30'
            : 'btn-primary'
          }`}
        style={!club.isMember ? { background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' } : {}}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {club.isMember ? '✓ Member — Leave' : 'Join Club'}
      </button>
    </div>
  )
}

function CreateClubModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', category: 'Academic' as ClubCategory, president: '', email: '', meeting_schedule: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await clubsAPI.create(form)
      toast.success('Club created!')
      onCreated()
      onClose()
    } catch { toast.error('Failed to create club') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a Club">
      <form onSubmit={handleSubmit} className="space-y-4 bg-blue-700 p-5 rounded-xl">
        <div>
          <label className="block text-xs text-surface-300 mb-1.5">Club Name</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="e.g. e.g. Tech Innovation Club" />
        </div>

        <div>
          <label className="block text-xs text-surface-300 mb-1.5">Description</label>
          <textarea className="input min-h-[80px] resize-none" value={form.description} onChange={set('description')} required placeholder="What does this club do?" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            {/* ✅ FIXED */}
            <label htmlFor="category" className="block text-xs text-surface-300 mb-1.5">Category</label>
            <select
              id="category"
              className="input"
              value={form.category}
              onChange={set('category')}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-surface-300 mb-1.5">President</label>
            <input className="input" value={form.president} onChange={set('president')} required placeholder="Full name" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-surface-300 mb-1.5">Contact Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} required placeholder="club@university.edu" />
        </div>

        <div>
          <label className="block text-xs text-surface-300 mb-1.5">
            Meeting Schedule <span className="text-surface-500">(optional)</span>
          </label>
          <input className="input" value={form.meeting_schedule} onChange={set('meeting_schedule')} placeholder="e.g. Every Friday 4pm, Room 205" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 transition-all">
            Cancel
            </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Club
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await clubsAPI.getAll()
      const filtered = filter === 'All' ? res.data : res.data.filter(c => c.category === filter)
      setClubs(filtered)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const handleJoin = async (id: string) => {
    try {
      const res = await clubsAPI.join(id)
      setClubs(cl => cl.map(c => c._id === id ? { ...c, memberCount: res.memberCount, isMember: !c.isMember } : c))
      toast.success('Membership updated!')
    } catch { toast.error('Could not update membership') }
  }

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader
        title="Clubs & Societies"
        subtitle={`${clubs.length} club${clubs.length !== 1 ? 's' : ''} on campus`}
        action={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
            style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}
          >
            <Plus className="w-4 h-4" /> New Club
          </button>
        }
      />

      <FilterBar options={CATEGORIES} active={filter} onChange={setFilter} />

      {loading ? <LoadingGrid /> : clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clubs yet"
          subtitle="Start the first one!"
          action={
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
            >
              Create Club
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map(c => <ClubCard key={c._id} club={c} onJoin={handleJoin} />)}
        </div>
      )}

      <CreateClubModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
    </div>
  )
}