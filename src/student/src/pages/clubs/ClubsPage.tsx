import { useEffect, useState, useMemo } from 'react'
import { Users, Mail, CalendarDays, Loader2, Plus, Search } from 'lucide-react'
import { clubsAPI } from '../../api/clubs'
import type { Club, ClubCategory } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const CATEGORIES: string[] = ['All', 'Academic', 'Sports', 'Arts', 'Religious', 'Technology', 'Community']
const CATEGORY_EMOJI: Record<string, string> = {
  Academic: '📚', Sports: '⚽', Arts: '🎨', Religious: '✝️', Technology: '💻', Community: '🤝',
}
const CAT_GRADIENT: Record<string, string> = {
  Academic:   'linear-gradient(135deg,#3b82f6,#6366f1)',
  Sports:     'linear-gradient(135deg,#10b981,#06b6d4)',
  Arts:       'linear-gradient(135deg,#a855f7,#ec4899)',
  Religious:  'linear-gradient(135deg,#f59e0b,#ef4444)',
  Technology: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  Community:  'linear-gradient(135deg,#8b5cf6,#a855f7)',
}

function ClubCard({ club, onJoin }: { club: Club; onJoin: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const gradient = CAT_GRADIENT[club.category] ?? CAT_GRADIENT.Technology

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-fade-in"
      style={{ background: '#1e1b4b' }}>
      <div className="h-1.5" style={{ background: gradient }} />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
            style={{ background: gradient }}>
            {CATEGORY_EMOJI[club.category] || '🏫'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-white text-sm leading-snug">{club.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 text-white/80 border border-white/20"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              {club.category}
            </span>
          </div>
        </div>

        <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{club.description}</p>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-300 text-xs">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>{club.memberCount} members · {club.president}</span>
          </div>
          {club.meetingSchedule && (
            <div className="flex items-center gap-2 text-indigo-300 text-xs">
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{club.meetingSchedule}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-indigo-300 text-xs">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <a href={`mailto:${club.email}`} className="hover:text-white transition-colors truncate">{club.email}</a>
          </div>
        </div>

        <button type="button" onClick={() => { setLoading(true); onJoin(club._id) }} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 mt-1"
          style={club.isMember
            ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }
            : { background: gradient, color: '#fff' }
          }>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {club.isMember ? '✓ Member — Leave' : 'Join Club'}
        </button>
      </div>
    </div>
  )
}

function CreateClubModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', category: 'Academic' as ClubCategory,
    president: '', email: '', meeting_schedule: '',
  })
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
      setForm({ name: '', description: '', category: 'Academic', president: '', email: '', meeting_schedule: '' })
    } catch { toast.error('Failed to create club') }
    finally { setLoading(false) }
  }

  const lbl = 'block text-xs text-slate-600 mb-1.5 font-medium'
  return (
    <Modal open={open} onClose={onClose} title="Create a Club">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className={lbl}>Club Name</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="e.g. Tech Innovation Club" maxLength={120} /></div>
        <div><label className={lbl}>Description</label>
          <textarea className="input min-h-[80px] resize-none" value={form.description} onChange={set('description')} required placeholder="What does this club do?" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="cl-cat" className={lbl}>Category</label>
            <select id="cl-cat" className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className={lbl}>President</label>
            <input className="input" value={form.president} onChange={set('president')} required placeholder="Full name" /></div>
        </div>
        <div><label className={lbl}>Contact Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} required placeholder="club@university.edu" /></div>
        <div><label className={lbl}>Meeting Schedule <span className="text-slate-400">(optional)</span></label>
          <input className="input" value={form.meeting_schedule} onChange={set('meeting_schedule')} placeholder="e.g. Every Friday 4pm, Room 205" /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Club
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function ClubsPage() {
  const [clubs, setClubs]       = useState<Club[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery]       = useState('')

  const filtered = useMemo(() => {
    let list = filter === 'All' ? clubs : clubs.filter(c => c.category === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    }
    return list
  }, [clubs, filter, query])

  const load = async () => {
    setLoading(true)
    try { const res = await clubsAPI.getAll(); setClubs(res.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleJoin = async (id: string) => {
    try {
      const res = await clubsAPI.join(id)
      setClubs(cl => cl.map(c => c._id === id ? { ...c, memberCount: res.member_count, isMember: !c.isMember } : c))
      toast.success('Membership updated!')
    } catch { toast.error('Could not update membership') }
  }

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader title="Clubs & Societies"
        subtitle={`${filtered.length} club${filtered.length !== 1 ? 's' : ''} on campus`}
        action={<button type="button" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Club</button>}
      />
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input className="input pl-10" placeholder="Search clubs…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <FilterBar options={CATEGORIES} active={filter} onChange={setFilter} />
      {loading ? <LoadingGrid /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No clubs found" subtitle="Start the first one!"
          action={<button type="button" onClick={() => setShowModal(true)} className="btn-primary">Create Club</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => <ClubCard key={c._id} club={c} onJoin={handleJoin} />)}
        </div>
      )}
      <CreateClubModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
    </div>
  )
}
