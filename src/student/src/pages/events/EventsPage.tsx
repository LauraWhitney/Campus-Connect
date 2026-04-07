import { useEffect, useState, useMemo } from 'react'
import { Calendar, MapPin, Users, Plus, Clock, Loader2, Search } from 'lucide-react'
import { eventsAPI } from '../../api/events'
import type { Event, EventCategory } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const CATEGORIES: string[] = ['All', 'Academic', 'Sports', 'Cultural', 'Spiritual', 'Career', 'Social']

// Each category gets a distinct blue→purple gradient
const CAT_GRADIENT: Record<string, { bg: string; badge: string }> = {
  Academic:  { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  Sports:    { bg: 'linear-gradient(135deg,#10b981,#06b6d4)', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  Cultural:  { bg: 'linear-gradient(135deg,#8b5cf6,#a855f7)', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  Spiritual: { bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  Career:    { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  Social:    { bg: 'linear-gradient(135deg,#ec4899,#8b5cf6)', badge: 'bg-pink-100 text-pink-700 border-pink-200' },
}
const DEFAULT_GRADIENT = { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' }

function EventCard({ event, onRsvp }: { event: Event; onRsvp: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const date = new Date(event.date)
  const g = CAT_GRADIENT[event.category] ?? DEFAULT_GRADIENT
  const isFull = !!(event.capacity && event.rsvpCount >= event.capacity && !event.hasRsvped)

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-fade-in"
      style={{ background: '#1e1b4b' }}>

      {/* Coloured top strip */}
      <div className="h-1.5 w-full" style={{ background: g.bg }} />

      <div className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Date badge */}
            <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0"
              style={{ background: g.bg }}>
              <span className="text-white text-base font-bold leading-none">{date.getDate()}</span>
              <span className="text-white/70 text-[10px] uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-sm leading-snug line-clamp-2">{event.title}</h3>
              <p className="text-indigo-300 text-xs mt-0.5">{event.organizer}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${g.badge}`}>
            {event.category}
          </span>
        </div>

        <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{event.description}</p>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-300 text-xs">
            <MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs">
            <Clock className="w-3.5 h-3.5 shrink-0" /><span>{event.time}</span>
            {event.capacity && (
              <span className="ml-auto flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className={isFull ? 'text-red-400' : 'text-indigo-300'}>{event.rsvpCount}/{event.capacity}</span>
              </span>
            )}
          </div>
        </div>

        <button onClick={() => { setLoading(true); onRsvp(event._id) }}
          disabled={loading || isFull}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 mt-1 disabled:opacity-50"
          style={event.hasRsvped
            ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }
            : isFull
              ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }
              : { background: g.bg, color: '#fff' }
          }>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isFull ? 'Event Full' : event.hasRsvped ? "✓ RSVP'd — Cancel" : 'RSVP for this Event'}
        </button>
      </div>
    </div>
  )
}

function CreateEventModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', category: 'Academic' as EventCategory,
    date: '', time: '', venue: '', organizer: '', capacity: '',
  })
  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await eventsAPI.create({ ...form, capacity: form.capacity ? Number(form.capacity) : undefined })
      toast.success('Event created!')
      onCreated()
      onClose()
      setForm({ title: '', description: '', category: 'Academic', date: '', time: '', venue: '', organizer: '', capacity: '' })
    } catch { toast.error('Failed to create event') }
    finally { setLoading(false) }
  }

  const labelCls = 'block text-xs text-slate-600 mb-1.5 font-medium'
  return (
    <Modal open={open} onClose={onClose} title="Create Event" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ev-title" className={labelCls}>Title</label>
          <input id="ev-title" className="input" value={form.title} onChange={set('title')} required placeholder="Event name" maxLength={200} />
        </div>
        <div>
          <label htmlFor="ev-desc" className={labelCls}>Description</label>
          <textarea id="ev-desc" className="input min-h-[80px] resize-none" value={form.description} onChange={set('description')} required placeholder="What's this event about?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ev-cat" className={labelCls}>Category</label>
            <select id="ev-cat" className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ev-cap" className={labelCls}>Capacity <span className="text-slate-400">(optional)</span></label>
            <input id="ev-cap" className="input" type="number" min="1" value={form.capacity} onChange={set('capacity')} placeholder="Unlimited" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ev-date" className={labelCls}>Date</label>
            <input id="ev-date" className="input" type="date" value={form.date} onChange={set('date')} required min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label htmlFor="ev-time" className={labelCls}>Time</label>
            <input id="ev-time" className="input" type="time" value={form.time} onChange={set('time')} required />
          </div>
        </div>
        <div>
          <label htmlFor="ev-venue" className={labelCls}>Venue</label>
          <input id="ev-venue" className="input" value={form.venue} onChange={set('venue')} required placeholder="e.g. Main Hall" maxLength={200} />
        </div>
        <div>
          <label htmlFor="ev-org" className={labelCls}>Organizer</label>
          <input id="ev-org" className="input" value={form.organizer} onChange={set('organizer')} required placeholder="Club or department name" maxLength={120} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Event
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function EventsPage() {
  const [events, setEvents]     = useState<Event[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery]       = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return events
    const q = query.toLowerCase()
    return events.filter(e =>
      e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q)
    )
  }, [events, query])

  const load = async () => {
    setLoading(true)
    try {
      const res = await eventsAPI.getAll(1, filter === 'All' ? undefined : filter)
      setEvents(res.data)
    } catch { toast.error('Unable to load events. Please try again.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const handleRsvp = async (id: string) => {
    try {
      const res = await eventsAPI.rsvp(id)
      // backend returns { action, rsvp_count }
      setEvents(ev => ev.map(e =>
        e._id === id ? { ...e, rsvpCount: res.rsvp_count, hasRsvped: !e.hasRsvped } : e
      ))
      toast.success('RSVP updated!')
    } catch { toast.error('Could not update RSVP. Please try again.') }
  }

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader title="Campus Events"
        subtitle={`${results.length} event${results.length !== 1 ? 's' : ''} found`}
        action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create Event</button>}
      />
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input className="input pl-10" placeholder="Search events by title, venue, organizer…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <FilterBar options={CATEGORIES} active={filter} onChange={setFilter} />
      {loading ? <LoadingGrid /> : results.length === 0 ? (
        <EmptyState icon={Calendar} title={query ? `No results for "${query}"` : 'No events found'}
          subtitle={query ? 'Try a different search.' : 'Be the first to create one!'}
          action={!query ? <button onClick={() => setShowModal(true)} className="btn-primary">Create Event</button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(e => <EventCard key={e._id} event={e} onRsvp={handleRsvp} />)}
        </div>
      )}
      <CreateEventModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
    </div>
  )
}
