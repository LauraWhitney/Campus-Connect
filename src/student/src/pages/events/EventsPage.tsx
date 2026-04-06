import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, Plus, Clock, Loader2 } from 'lucide-react'
import { eventsAPI } from '../../api/events'
import type { Event, EventCategory } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import { useSearch } from '../../hooks/useSearch'

const CATEGORIES: string[] = ['All', 'Academic', 'Sports', 'Cultural', 'Spiritual', 'Career', 'Social']

function EventCard({ event, onRsvp }: { event: Event; onRsvp: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const date = new Date(event.date)

  const handleRsvp = async () => {
    setLoading(true)
    try { await onRsvp(event._id) } finally { setLoading(false) }
  }

  return (
    <div className="card p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-700/60 border border-surface-600/40 flex flex-col items-center justify-center shrink-0">
            <span className="text-primary-400 text-lg font-bold font-display leading-none">{date.getDate()}</span>
            <span className="text-surface-400 text-[10px] uppercase tracking-wide">
              {date.toLocaleString('default', { month: 'short' })}
            </span>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white text-sm leading-snug line-clamp-2">
              {event.title}
            </h3>
            <p className="text-surface-400 text-xs mt-0.5">{event.organizer}</p>
          </div>
        </div>

        <span className="badge-brand shrink-0 ml-2">{event.category}</span>
      </div>

      <p className="text-surface-300 text-xs line-clamp-2 leading-relaxed">
        {event.description}
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-surface-400 text-xs">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{event.venue}</span>
        </div>

        <div className="flex items-center gap-2 text-surface-400 text-xs">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{event.time}</span>

          {event.capacity && (
            <span className="ml-auto flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.rsvpCount}/{event.capacity}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleRsvp}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
          ${event.hasRsvped
            ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 hover:bg-primary-500/30'
            : 'btn-primary'
          }`}
        style={!event.hasRsvped ? { background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' } : {}}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {event.hasRsvped ? "✓ RSVP'd — Cancel" : 'RSVP for this Event'}
      </button>
    </div>
  )
}

function CreateEventModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Academic' as EventCategory,
    date: '',
    time: '',
    venue: '',
    organizer: '',
    capacity: ''
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await eventsAPI.create({
        ...form,
        capacity: form.capacity ? Number(form.capacity) : undefined
      })

      toast.success('Event created!')
      onCreated()
      onClose()
    } catch {
      toast.error('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Event" size="md">
      <form onSubmit={handleSubmit} className="space-y-4  bg-blue-700 p-5 rounded-xl">

        <div>
          <label htmlFor="event-title" className="block text-xs text-surface-300 mb-1.5">Title</label>
          <input
            id="event-title"
            className="input"
            value={form.title}
            onChange={set('title')}
            required
            placeholder="Event name"
          />
        </div>

        <div>
          <label htmlFor="event-description" className="block text-xs text-surface-300 mb-1.5">Description</label>
          <textarea
            id="event-description"
            className="input min-h-[80px] resize-none"
            value={form.description}
            onChange={set('description')}
            required
            placeholder="What's this event about?"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="event-category" className="block text-xs text-surface-300 mb-1.5">Category</label>
            <select
              id="event-category"
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
            <label htmlFor="event-capacity" className="block text-xs text-surface-300 mb-1.5">Capacity</label>
            <input
              id="event-capacity"
              className="input"
              type="number"
              value={form.capacity}
              onChange={set('capacity')}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="event-date" className="block text-xs text-surface-300 mb-1.5">Date</label>
            <input
              id="event-date"
              className="input"
              type="date"
              value={form.date}
              onChange={set('date')}
              required
            />
          </div>

          <div>
            <label htmlFor="event-time" className="block text-xs text-surface-300 mb-1.5">Time</label>
            <input
              id="event-time"
              className="input"
              type="time"
              value={form.time}
              onChange={set('time')}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="event-venue" className="block text-xs text-surface-300 mb-1.5">Venue</label>
          <input
            id="event-venue"
            className="input"
            value={form.venue}
            onChange={set('venue')}
            required
            placeholder="e.g. Main Hall"
          />
        </div>

        <div>
          <label htmlFor="event-organizer" className="block text-xs text-surface-300 mb-1.5">Organizer</label>
          <input
            id="event-organizer"
            className="input"
            value={form.organizer}
            onChange={set('organizer')}
            required
            placeholder="Club or department name"
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
            Create Event
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
  const { query, setQuery, results } = useSearch(events, ['title', 'description', 'venue', 'organizer'])

  const load = async () => {
    setLoading(true)
    try {
      const res = await eventsAPI.getAll(1, filter === 'All' ? undefined : filter)
      setEvents(res.data)
    } catch {
      toast.error('Unable to load events. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const handleRsvp = async (id: string) => {
    try {
      const res = await eventsAPI.rsvp(id)
      setEvents(ev => ev.map(e =>
        e._id === id ? { ...e, rsvpCount: res.data.rsvpCount, hasRsvped: !e.hasRsvped } : e
      ))
      toast.success('RSVP updated!')
    } catch {
      toast.error('Could not update RSVP. Please try again.')
    }
  }

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader
        title="Campus Events"
        subtitle={`${results.length} event${results.length !== 1 ? 's' : ''} found`}
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Event
          </button>
        }
      />

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          className="input pl-10"
          placeholder="Search events by title, venue, organizer…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <FilterBar options={CATEGORIES} active={filter} onChange={setFilter} />

      {loading ? (
        <LoadingGrid />
      ) : results.length === 0 ? (
        <EmptyState icon={Calendar} title="No events found"
          subtitle={query ? `No results for "${query}"` : 'Be the first to create one!'}
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