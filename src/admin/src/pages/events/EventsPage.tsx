import { useEffect, useState, useMemo } from 'react'
import { Calendar, Trash2, Users, Search } from 'lucide-react'
import { eventsAPI } from '../../api/admin'
import type { Event } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'

const CAT_BADGE: Record<string, string> = {
  Academic: 'badge-blue', Sports: 'badge-green', Cultural: 'badge-brand',
  Spiritual: 'badge-surface', Career: 'badge-yellow', Social: 'badge-surface',
}

export default function EventsPage() {
  const [events, setEvents]         = useState<Event[]>([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [pages, setPages]           = useState(1)
  const [total, setTotal]           = useState(0)
  const [query, setQuery]           = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await eventsAPI.getAll(p)
      setEvents(res.data); setPages(res.pages); setTotal(res.total)
    } catch {
      toast.error('Unable to load events.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const results = useMemo(() => {
    if (!query.trim()) return events
    const q = query.toLowerCase()
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    )
  }, [events, query])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await eventsAPI.delete(deleteTarget.id)
      toast.success('Event deleted')
      load(page)
    } catch { toast.error('Failed to delete event') }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        title="Events Management"
        subtitle={`${total} event${total !== 1 ? 's' : ''} total`}
      />

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
        <input className="input pl-10" placeholder="Search by title, venue, organizer or category…"
          value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {loading ? <TableSkeleton cols={6} rows={8} /> : results.length === 0 ? (
        <EmptyState icon={Calendar}
          title={query ? `No results for "${query}"` : 'No events yet'}
          subtitle={query ? 'Try a different search term.' : 'Events posted by students will appear here.'} />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-surface-700/40">
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
                  <td className="td text-surface-400 hidden md:table-cell">
                    {new Date(ev.date).toLocaleDateString(undefined, {
                      day: 'numeric', month: 'short',
                    })} · {ev.time}
                  </td>
                  <td className="td text-surface-400 hidden md:table-cell max-w-[130px] truncate">
                    {ev.venue}
                  </td>
                  <td className="td text-surface-300 hidden lg:table-cell">
                    {ev.rsvp_count}{ev.capacity ? ` / ${ev.capacity}` : ''}
                  </td>
                  <td className="td text-right">
                    <button onClick={() => setDeleteTarget(ev)}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label={`Delete event: ${ev.title}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {!query && <Pagination page={page} pages={pages} onChange={setPage} />}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Event"
        message={`Delete "${deleteTarget?.title}"? Students who RSVPd will lose their registration.`}
        danger
      />
    </div>
  )
}
