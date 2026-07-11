import { useEffect, useState, useMemo } from 'react'
import { Users, Mail, CalendarDays, MapPin, Loader2, Plus, Search, UserCheck, UserX, Trash2 } from 'lucide-react'
import { clubsAPI } from '../../api/clubs'
import type { Club, ClubCategory } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const CATEGORIES: string[] = [
  'All', 'Academic', 'Sports', 'Arts', 'Catholic Ministry',
  'Technology', 'Law Society', 'Music & Performing Arts', 'Community Service', 'Science',
]

const CATEGORY_EMOJI: Record<string, string> = {
  Academic: '📚', Sports: '⚽', Arts: '🎨', 'Catholic Ministry': '✝️',
  Technology: '💻', 'Law Society': '⚖️', 'Music & Performing Arts': '🎵',
  'Community Service': '🤝', Science: '🔬',
}

const CAT_GRADIENT: Record<string, string> = {
  Academic: 'linear-gradient(135deg,#3b82f6,#c81e45)',
  Sports: 'linear-gradient(135deg,#10b981,#06b6d4)',
  Arts: 'linear-gradient(135deg,#a855f7,#ec4899)',
  'Catholic Ministry': 'linear-gradient(135deg,#f59e0b,#ef4444)',
  Technology: 'linear-gradient(135deg,#c81e45,#d4af37)',
  'Law Society': 'linear-gradient(135deg,#0ea5e9,#c81e45)',
  'Music & Performing Arts': 'linear-gradient(135deg,#ec4899,#f59e0b)',
  'Community Service': 'linear-gradient(135deg,#d4af37,#a855f7)',
  Science: 'linear-gradient(135deg,#14b8a6,#3b82f6)',
}

// ── Join Form Modal ───────────────────────────────────
function JoinFormModal({ club, open, onClose, onJoined }: {
  club: Club; open: boolean; onClose: () => void; onJoined: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', course: '', year_of_study: '', phone_number: '',
  })
  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    try {
      await clubsAPI.join(club._id, {
        ...form, year_of_study: Number(form.year_of_study),
      })
      toast.success('Membership request submitted! Waiting for club owner approval.')
      onJoined()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to submit request')
    } finally { setLoading(false) }
  }

  const lbl = 'block text-xs text-slate-600 mb-1.5 font-medium'
  return (
    <Modal open={open} onClose={onClose} title={`Join ${club.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-slate-400 text-xs">Fill in your details to request membership.</p>
        <div>
          <label className={lbl}>Full Name</label>
          <input className="input" value={form.full_name} onChange={set('full_name')} required placeholder="As it appears on your ID card" />
        </div>
        <div>
          <label className={lbl}>Course / Programme</label>
          <input className="input" value={form.course} onChange={set('course')} required placeholder="e.g. BSc Computer Science" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Year of Study</label>
            <select className="input" value={form.year_of_study} onChange={set('year_of_study')} required>
              <option value="">Select year</option>
              {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Phone Number</label>
            <input className="input" value={form.phone_number} onChange={set('phone_number')} required placeholder="+254…" />
          </div>
        </div>
        <div>
          <label className={lbl}>University Email</label>
          <div className="input flex items-center gap-2 opacity-80 cursor-not-allowed">
            <Mail className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="truncate">{user?.email}</span>
          </div>
          <p className="text-slate-500 text-[11px] mt-1">Used to identify you to the club — no admission number needed.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Request
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Members Management Modal (for club owner) ─────────
function MembersModal({ club, onClose }: { club: Club; onClose: () => void }) {
  const [data, setData]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const d = await clubsAPI.getMembers(club._id)
      setData(d)
    } catch { toast.error('Failed to load members') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [club._id])

  const handle = async (reqId: number, action: 'approve' | 'reject') => {
    try {
      await clubsAPI.manageMember(club._id, reqId, action)
      toast.success(`Member ${action}d`)
      load()
    } catch { toast.error(`Failed to ${action} member`) }
  }

  return (
    <Modal open onClose={onClose} title={`Members — ${club.name}`} size="md">
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
      ) : !data ? null : (
        <div>
          <div className="flex gap-4 mb-4 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">{data.member_count} approved</span>
            <span className="text-amber-400 font-semibold">{data.pending_count} pending</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {data.requests.map((r: any) => (
              <div key={r.id} className="p-3 rounded-xl space-y-1"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-white text-xs font-medium">{r.full_name}</p>
                    <p className="text-indigo-300 text-[10px]">{r.user_email}</p>
                    <p className="text-slate-400 text-[10px]">{r.course}, Yr {r.year_of_study} · {r.phone_number}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {r.status === 'pending' ? (
                      <>
                        <button onClick={() => handle(r.id, 'approve')}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                          style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <UserCheck className="w-3 h-3" /> Accept
                        </button>
                        <button onClick={() => handle(r.id, 'reject')}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                          <UserX className="w-3 h-3" /> Reject
                        </button>
                      </>
                    ) : (
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${r.status === 'approved' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>
                        {r.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {data.requests.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No membership requests yet.</p>}
          </div>
        </div>
      )}
    </Modal>
  )
}

function ClubCard({ club, onLeave, onDelete, onShowMembers, onJoin }: {
  club: Club
  onLeave: (id: string) => void
  onDelete: (id: string) => void
  onShowMembers: (club: Club) => void
  onJoin: (club: Club) => void
}) {
  const [loading, setLoading]       = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const gradient = CAT_GRADIENT[club.category] ?? CAT_GRADIENT.Technology

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-fade-in"
      style={{ background: '#2e000b' }}>
      <div className="h-1.5" style={{ background: gradient }} />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
            style={{ background: gradient }}>
            {CATEGORY_EMOJI[club.category] || '🏫'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-white text-sm leading-snug">{club.name}</h3>
              {club.isOwner && (
                <button onClick={async () => { setDeleteLoading(true); await onDelete(club._id); setDeleteLoading(false) }}
                  disabled={deleteLoading} title="Delete club"
                  className="p-1 rounded-lg shrink-0" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
                  {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            {club.isOwner && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5"
                style={{ background: 'rgba(200,30,69,0.3)', color: '#f5cd6b' }}>YOUR CLUB</span>
            )}
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
            <span>{club.memberCount} member{club.memberCount !== 1 ? 's' : ''} · {club.president}</span>
          </div>
          {club.meetingSchedule && (
            <div className="flex items-center gap-2 text-indigo-300 text-xs">
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{club.meetingSchedule}</span>
            </div>
          )}
          {club.meetingLocation && (
            <div className="flex items-center gap-2 text-indigo-300 text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{club.meetingLocation}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-indigo-300 text-xs">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <a href={`mailto:${club.email}`} className="hover:text-white transition-colors truncate">{club.email}</a>
          </div>
        </div>

        {/* Owner: manage members */}
        {club.isOwner && (
          <button type="button" onClick={() => onShowMembers(club)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(200,30,69,0.2)', border: '1px solid rgba(200,30,69,0.4)', color: '#f5cd6b' }}>
            <Users className="w-3.5 h-3.5" /> Manage Members ({club.memberCount})
          </button>
        )}

        {/* Member: leave */}
        {!club.isOwner && club.isMember && (
          <button type="button"
            onClick={() => { setLoading(true); onLeave(club._id) }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 mt-1"
            style={{ background: 'rgba(200,30,69,0.2)', border: '1px solid rgba(200,30,69,0.4)', color: '#f5cd6b' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            ✓ Member — Leave Club
          </button>
        )}

        {/* Pending: cancel */}
        {!club.isOwner && club.hasPending && !club.isMember && (
          <button type="button"
            onClick={() => { setLoading(true); onLeave(club._id) }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 mt-1"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fde68a' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            ⏳ Request Pending — Cancel
          </button>
        )}

        {/* Not member: join */}
        {!club.isOwner && !club.isMember && !club.hasPending && (
          <button type="button" onClick={() => onJoin(club)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 mt-1"
            style={{ background: gradient, color: '#fff' }}>
            Join Club
          </button>
        )}
      </div>
    </div>
  )
}

function CreateClubModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', category: 'Academic' as ClubCategory,
    president: '', email: '', meeting_schedule: '', meeting_location: '',
  })
  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await clubsAPI.create(form)
      toast.success('Club created!')
      onCreated()
      onClose()
      setForm({ name: '', description: '', category: 'Academic', president: '', email: '', meeting_schedule: '', meeting_location: '' })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to create club'
      toast.error(msg)
    }
    finally { setLoading(false) }
  }

  const lbl = 'block text-xs text-slate-600 mb-1.5 font-medium'
  return (
    <Modal open={open} onClose={onClose} title="Register a Club">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
          Only school-registered clubs may be created. The club must not already exist in the system.
        </p>
        <div><label className={lbl}>Club Name</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="e.g. CUEA Tech Club" maxLength={120} /></div>
        <div><label className={lbl}>Description</label>
          <textarea className="input min-h-[80px] resize-none" value={form.description} onChange={set('description')} required placeholder="What does this club do?" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="cl-cat" className={lbl}>Category</label>
            <select id="cl-cat" className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className={lbl}>Club Leader / President</label>
            <input className="input" value={form.president} onChange={set('president')} required placeholder="Full name" /></div>
        </div>
        <div><label className={lbl}>Contact Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} required placeholder="club@cuea.edu" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Meeting Schedule <span className="text-slate-400">(optional)</span></label>
            <input className="input" value={form.meeting_schedule} onChange={set('meeting_schedule')} placeholder="e.g. Every Friday 4pm" /></div>
          <div><label className={lbl}>Meeting Location <span className="text-slate-400">(optional)</span></label>
            <input className="input" value={form.meeting_location} onChange={set('meeting_location')} placeholder="e.g. Room 205, Block B" /></div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Register Club
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function ClubsPage() {
  const [clubs, setClubs]             = useState<Club[]>([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('All')
  const [showModal, setShowModal]     = useState(false)
  const [query, setQuery]             = useState('')
  const [joinClub, setJoinClub]       = useState<Club | null>(null)
  const [membersClub, setMembersClub] = useState<Club | null>(null)

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

  const handleLeave = async (id: string) => {
    try {
      await clubsAPI.join(id) // empty payload = leave/cancel
      load()
      toast.success('Membership updated!')
    } catch { toast.error('Could not update membership') }
  }

  const handleDelete = async (id: string) => {
    try {
      await clubsAPI.delete(id)
      setClubs(cl => cl.filter(c => c._id !== id))
      toast.success('Club deleted.')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete club')
    }
  }

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader title="Clubs & Societies"
        subtitle={`${filtered.length} club${filtered.length !== 1 ? 's' : ''} at CUEA`}
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
          {filtered.map(c => (
            <ClubCard key={c._id} club={c}
              onLeave={handleLeave} onDelete={handleDelete}
              onShowMembers={setMembersClub} onJoin={setJoinClub}
            />
          ))}
        </div>
      )}
      <CreateClubModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
      {joinClub && (
        <JoinFormModal club={joinClub} open onClose={() => setJoinClub(null)} onJoined={load} />
      )}
      {membersClub && <MembersModal club={membersClub} onClose={() => { setMembersClub(null); load() }} />}
    </div>
  )
}