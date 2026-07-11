import { useEffect, useState, useMemo } from 'react'
import { Calendar, MapPin, Users, Plus, Clock, Loader2, Search, CheckCircle2, Trash2, UserCheck, UserX } from 'lucide-react'
import { eventsAPI } from '../../api/events'
import type { Event, EventCategory } from '../../types'
import { EmptyState, LoadingGrid, PageHeader, FilterBar } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const CATEGORIES: string[] = [
  'All', 'Academic', 'Sports', 'Cultural', 'Spiritual',
  'Career', 'Social', 'Convocation', 'Staff Development',
]

const CAT_GRADIENT: Record<string, { bg: string; badge: string }> = {
  Academic:         { bg: 'linear-gradient(135deg,#3b82f6,#c81e45)', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  Sports:           { bg: 'linear-gradient(135deg,#10b981,#06b6d4)', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  Cultural:         { bg: 'linear-gradient(135deg,#d4af37,#a855f7)', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  Spiritual:        { bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  Career:           { bg: 'linear-gradient(135deg,#c81e45,#d4af37)', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  Social:           { bg: 'linear-gradient(135deg,#ec4899,#d4af37)', badge: 'bg-pink-100 text-pink-700 border-pink-200' },
  Convocation:      { bg: 'linear-gradient(135deg,#0ea5e9,#c81e45)', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
  'Staff Development': { bg: 'linear-gradient(135deg,#14b8a6,#3b82f6)', badge: 'bg-teal-100 text-teal-700 border-teal-200' },
}
const DEFAULT_GRADIENT = { bg: 'linear-gradient(135deg,#c81e45,#d4af37)', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' }

// ── RSVP Manage Panel (for event creator) ────────────
function RsvpManagePanel({ event, onClose }: { event: Event; onClose: () => void }) {
  const [rsvps, setRsvps]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await eventsAPI.getRsvps(event._id)
      setRsvps(data.requests)
    } catch { toast.error('Failed to load RSVPs') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [event._id])

  const handle = async (rsvpId: number, action: 'approve' | 'reject') => {
    try {
      await eventsAPI.manageRsvp(event._id, rsvpId, action)
      toast.success(`RSVP ${action}d`)
      load()
    } catch { toast.error(`Failed to ${action} RSVP`) }
  }

  return (
    <Modal open onClose={onClose} title={`RSVPs — ${event.title}`} size="md">
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
      ) : rsvps.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">No RSVP requests yet.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {rsvps.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <p className="text-white text-xs font-medium">{r.user_name}</p>
                <p className="text-indigo-300 text-[10px]">{r.user_email}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {r.status === 'pending' ? (
                  <>
                    <button onClick={() => handle(r.id, 'approve')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <UserCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => handle(r.id, 'reject')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <UserX className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                ) : (
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${r.status === 'approved' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>
                    {r.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function EventCard({ event, onRsvp, onCheckIn, onDelete, onManageRsvps, onEdit }: {
  event: Event
  onRsvp: (id: string) => void
  onCheckIn: (id: string) => void
  onDelete: (id: string) => void
  onManageRsvps: (event: Event) => void
  onEdit: (event: Event) => void
}) {
  const [rsvpLoading, setRsvpLoading]       = useState(false)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [checkedIn, setCheckedIn]           = useState(false)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const date = new Date(event.date)
  const g    = CAT_GRADIENT[event.category] ?? DEFAULT_GRADIENT
  const isFull = !!(event.capacity && event.rsvpCount >= event.capacity && !event.hasRsvped && !event.pendingRsvp)

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-fade-in"
      style={{ background: '#2e000b' }}>
      <div className="h-1.5 w-full" style={{ background: g.bg }} />

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0"
              style={{ background: g.bg }}>
              <span className="text-white text-base font-bold leading-none">{date.getDate()}</span>
              <span className="text-white/70 text-[10px] uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-sm leading-snug line-clamp-2">{event.title}</h3>
              <p className="text-indigo-300 text-xs mt-0.5">{event.organizer}</p>
              {event.isCreator && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5"
                  style={{ background: 'rgba(200,30,69,0.3)', color: '#f5cd6b' }}>
                  YOUR EVENT
                </span>
              )}
              {event.isCreator && event.approvalStatus && event.approvalStatus !== 'approved' && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 ml-1 ${
                  event.approvalStatus === 'rejected' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {event.approvalStatus === 'rejected' ? 'REJECTED' : 'AWAITING APPROVAL'}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${g.badge}`}>
              {event.category}
            </span>
            {event.isCreator && (
              <button onClick={async () => { setDeleteLoading(true); await onDelete(event._id); setDeleteLoading(false) }}
                disabled={deleteLoading}
                title="Delete event"
                className="p-1 rounded-lg transition-colors"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
                {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
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

        {/* Rejected: show reason + let owner edit and resubmit */}
        {event.isCreator && event.approvalStatus === 'rejected' && (
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {event.rejectionReason && (
              <p className="text-red-300 text-[11px] leading-relaxed">
                <span className="font-semibold">Admin feedback:</span> {event.rejectionReason}
              </p>
            )}
            <button onClick={() => onEdit(event)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              Edit &amp; Resubmit
            </button>
          </div>
        )}

        {/* Creator: manage RSVPs */}
        {event.isCreator && (
          <button onClick={() => onManageRsvps(event)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(200,30,69,0.2)', border: '1px solid rgba(200,30,69,0.4)', color: '#f5cd6b' }}>
            <Users className="w-3.5 h-3.5" />
            Manage RSVPs ({event.rsvpCount} approved{event.pendingRsvpCount ? `, ${event.pendingRsvpCount} pending` : ''})
          </button>
        )}

        {/* RSVP button (non-creator) */}
        {!event.isCreator && (
          <button
            onClick={() => { setRsvpLoading(true); onRsvp(event._id) }}
            disabled={rsvpLoading || isFull}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 mt-1 disabled:opacity-50"
            style={event.hasRsvped
              ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7' }
              : event.pendingRsvp
                ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#fde68a' }
                : isFull
                  ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }
                  : { background: g.bg, color: '#fff' }
            }>
            {rsvpLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isFull ? 'Event Full'
              : event.hasRsvped ? '✓ Approved — Undo RSVP'
              : event.pendingRsvp ? '⏳ Pending Approval — Cancel'
              : 'Request RSVP'}
          </button>
        )}

        {/* Check-in button */}
        {event.hasRsvped && !checkedIn && (
          <button
            onClick={async () => {
              setCheckinLoading(true)
              try { await onCheckIn(event._id); setCheckedIn(true) }
              finally { setCheckinLoading(false) }
            }}
            disabled={checkinLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7' }}>
            {checkinLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Check In at Event
          </button>
        )}
        {checkedIn && (
          <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
          </div>
        )}
      </div>
    </div>
  )
}

function CreateEventModal({ open, onClose, onCreated, editEvent }: {
  open: boolean; onClose: () => void; onCreated: () => void; editEvent?: Event | null
}) {
  const isEdit = !!editEvent
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', category: 'Academic' as EventCategory,
    date: '', time: '', venue: '', organizer: '', capacity: '',
  })

  // Populate the form when opening in edit mode (or reset when creating fresh)
  useEffect(() => {
    if (!open) return
    if (editEvent) {
      setForm({
        title: editEvent.title, description: editEvent.description,
        category: editEvent.category, date: editEvent.date, time: editEvent.time,
        venue: editEvent.venue, organizer: editEvent.organizer,
        capacity: editEvent.capacity ? String(editEvent.capacity) : '',
      })
    } else {
      setForm({ title: '', description: '', category: 'Academic', date: '', time: '', venue: '', organizer: '', capacity: '' })
    }
  }, [open, editEvent])

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, capacity: form.capacity ? Number(form.capacity) : undefined }
      if (isEdit && editEvent) {
        await eventsAPI.update(editEvent._id, payload)
        toast.success('Event updated and resubmitted for approval!')
      } else {
        await eventsAPI.create(payload)
        toast.success('Event submitted for approval!')
      }
      onCreated()
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} event`
      toast.error(msg)
    }
    finally { setLoading(false) }
  }

  const labelCls = 'block text-xs text-slate-600 mb-1.5 font-medium'
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit & Resubmit Event' : 'Create Event'} size="md">
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
          <input id="ev-venue" className="input" value={form.venue} onChange={set('venue')} required placeholder="e.g. CUEA Main Auditorium" maxLength={200} />
        </div>
        <div>
          <label htmlFor="ev-org" className={labelCls}>Organizer</label>
          <input id="ev-org" className="input" value={form.organizer} onChange={set('organizer')} required placeholder="Club or department name" maxLength={120} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {isEdit ? 'Resubmit Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function EventsPage() {
  const [events, setEvents]           = useState<Event[]>([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('All')
  const [showModal, setShowModal]     = useState(false)
  const [editTarget, setEditTarget]   = useState<Event | null>(null)
  const [query, setQuery]             = useState('')
  const [manageEvent, setManageEvent] = useState<Event | null>(null)

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
      load() // reload to get updated state
      if (res.action === 'requested') toast.success('RSVP request sent! Waiting for creator approval.')
      else if (res.action === 'cancelled') toast.success('RSVP cancelled.')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not update RSVP.')
    }
  }

  const handleCheckIn = async (id: string) => {
    try {
      await eventsAPI.checkIn(id)
      toast.success('Checked in! Your attendance has been recorded.')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Check-in failed'
      toast.error(msg)
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await eventsAPI.delete(id)
      setEvents(ev => ev.filter(e => e._id !== id))
      toast.success('Event deleted.')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete event')
    }
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
          {results.map(e => (
            <EventCard key={e._id} event={e}
              onRsvp={handleRsvp} onCheckIn={handleCheckIn}
              onDelete={handleDelete} onManageRsvps={setManageEvent}
              onEdit={setEditTarget}
            />
          ))}
        </div>
      )}
      <CreateEventModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
      <CreateEventModal open={!!editTarget} onClose={() => setEditTarget(null)} onCreated={load} editEvent={editTarget} />
      {manageEvent && <RsvpManagePanel event={manageEvent} onClose={() => { setManageEvent(null); load() }} />}
    </div>
  )
}