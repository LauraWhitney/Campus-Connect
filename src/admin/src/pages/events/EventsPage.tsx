import { useEffect, useState, useMemo } from 'react'
import { Calendar, Trash2, Users, Search, BarChart2 } from 'lucide-react'
import { eventsAPI } from '../../api/admin'
import type { Event } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'

// CUEA event categories
const CAT_BADGE: Record<string, string> = {
  Academic:          'badge-blue',
  Sports:            'badge-green',
  Cultural:          'badge-brand',
  Spiritual:         'badge-yellow',
  Career:            'badge-purple',
  Social:            'badge-surface',
  Convocation:       'badge-blue',
  'Staff Development': 'badge-surface',
}

export default function EventsPage() {
  const [events, setEvents]             = useState<Event[]>([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(1)
  const [pages, setPages]               = useState(1)
  const [total, setTotal]               = useState(0)
  const [query, setQuery]               = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [attendanceTarget, setAttendanceTarget] = useState<Event | null>(null)
  const [attendanceData, setAttendanceData]     = useState<any>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await eventsAPI.getAll(p)
      setEvents(res.data); setPages(res.pages); setTotal(res.total)
    } catch { toast.error('Unable to load events.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const results = useMemo(() => {
    if (!query.trim()) return events
    const q = query.toLowerCase()
    return events.filter(e =>
      e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    )
  }, [events, query])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await eventsAPI.delete(deleteTarget.id); toast.success('Event deleted'); load(page) }
    catch { toast.error('Failed to delete event') }
  }

  const openAttendance = async (event: Event) => {
    setAttendanceTarget(event)
    setAttendanceLoading(true)
    try {
      const data = await eventsAPI.getAttendance(event.id)
      setAttendanceData(data)
    } catch { toast.error('Failed to load attendance') }
    finally { setAttendanceLoading(false) }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Events Management" subtitle={`${total} event${total !== 1 ? 's' : ''} total`} />

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input className="input pl-10" placeholder="Search by title, venue, organizer or category…"
          value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {loading ? <TableSkeleton cols={7} rows={8} /> : results.length === 0 ? (
        <EmptyState icon={Calendar}
          title={query ? `No results for "${query}"` : 'No events yet'}
          subtitle={query ? 'Try a different search term.' : 'Events posted by students will appear here.'} />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Title</th>
                <th className="th hidden sm:table-cell">Category</th>
                <th className="th hidden md:table-cell">Date</th>
                <th className="th hidden md:table-cell">Venue</th>
                <th className="th hidden lg:table-cell">
                  <Users className="w-3.5 h-3.5 inline mr-1" />RSVPs
                </th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map(ev => (
                <tr key={ev.id} className="table-row">
                  <td className="td font-medium text-white max-w-[200px] truncate">{ev.title}</td>
                  <td className="td hidden sm:table-cell">
                    <span className={CAT_BADGE[ev.category] ?? 'badge-surface'}>{ev.category}</span>
                  </td>
                  <td className="td text-slate-500 hidden md:table-cell">
                    {new Date(ev.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {ev.time}
                  </td>
                  <td className="td text-slate-500 hidden md:table-cell max-w-[120px] truncate">{ev.venue}</td>
                  <td className="td text-slate-700 hidden lg:table-cell font-medium">
                    {ev.rsvp_count}{ev.capacity ? ` / ${ev.capacity}` : ''}
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openAttendance(ev)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                        title="View attendance">
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(ev)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label={`Delete event: ${ev.title}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {!query && <Pagination page={page} pages={pages} onChange={setPage} />}
        </>
      )}

      {/* Attendance modal */}
      <Modal open={!!attendanceTarget} onClose={() => { setAttendanceTarget(null); setAttendanceData(null) }}
        title="Event Attendance" size="sm">
        {attendanceLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : attendanceData ? (
          <div className="space-y-4">
            <p className="text-slate-700 font-medium">{attendanceData.event_title}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 text-center">
                <p className="text-2xl font-bold text-indigo-700">{attendanceData.rsvp_count}</p>
                <p className="text-xs text-indigo-500 mt-0.5">RSVP'd</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-center">
                <p className="text-2xl font-bold text-emerald-700">{attendanceData.checked_in_count}</p>
                <p className="text-xs text-emerald-500 mt-0.5">Checked In</p>
              </div>
            </div>
            {attendanceData.rsvp_count > 0 && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Attendance rate</span>
                  <span>{Math.round((attendanceData.checked_in_count / attendanceData.rsvp_count) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.round((attendanceData.checked_in_count / attendanceData.rsvp_count) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Event"
        message={`Delete "${deleteTarget?.title}"? Students who RSVPd will lose their registration.`} danger />
    </div>
  )
}
