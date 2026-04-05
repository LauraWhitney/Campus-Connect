import { useEffect, useState } from 'react'
import { MessageSquare, ChevronDown } from 'lucide-react'
import { feedbackAPI } from '../../api/admin'
import type { Feedback } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'

const STATUS_BADGE: Record<string, string> = {
  Pending:  'badge-yellow',
  Reviewed: 'badge-blue',
  Resolved: 'badge-green',
}

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewTarget, setViewTarget] = useState<Feedback | null>(null)
  const [statusTarget, setStatusTarget] = useState<Feedback | null>(null)
  const [newStatus, setNewStatus] = useState('Reviewed')

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await feedbackAPI.getAll(p)
      setItems(res.data); setPages(res.pages); setTotal(res.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const handleStatusChange = async () => {
    if (!statusTarget) return
    try { await feedbackAPI.updateStatus(statusTarget.id, newStatus); toast.success('Status updated'); load(page) }
    catch { toast.error('Failed to update status') }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Feedback & Reports" subtitle={`${total} submission${total !== 1 ? 's' : ''}`} />

      {loading ? <TableSkeleton cols={6} rows={8} /> : items.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No feedback yet" />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-navy-700/40">
                <th className="th">Title</th>
                <th className="th hidden sm:table-cell">Category</th>
                <th className="th hidden md:table-cell">Department</th>
                <th className="th">Status</th>
                <th className="th hidden lg:table-cell">From</th>
                <th className="th hidden lg:table-cell">Date</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(fb => (
                <tr key={fb.id} className="table-row">
                  <td className="td font-medium text-white max-w-[180px] truncate">{fb.title}</td>
                  <td className="td hidden sm:table-cell"><span className="badge-navy">{fb.category}</span></td>
                  <td className="td text-navy-400 hidden md:table-cell max-w-[140px] truncate">{fb.department}</td>
                  <td className="td"><span className={STATUS_BADGE[fb.status] ?? 'badge-navy'}>{fb.status}</span></td>
                  <td className="td text-navy-400 hidden lg:table-cell">
                    {fb.is_anonymous ? <span className="text-navy-500 italic">Anonymous</span> : fb.submitted_by?.name ?? '—'}
                  </td>
                  <td className="td text-navy-500 hidden lg:table-cell">
                    {new Date(fb.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewTarget(fb)}
                        className="px-2.5 py-1 rounded-lg text-xs text-navy-300 border border-navy-600/40 hover:border-gold-500/40 hover:text-gold-400 transition-colors">
                        View
                      </button>
                      <button onClick={() => { setStatusTarget(fb); setNewStatus(fb.status) }}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors" title="Update status">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      {/* View feedback modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Feedback Details" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-navy-400 mb-1">Title</p>
              <p className="text-white font-medium">{viewTarget.title}</p>
            </div>
            <div>
              <p className="text-xs text-navy-400 mb-1">Description</p>
              <p className="text-navy-200 text-sm leading-relaxed whitespace-pre-wrap">{viewTarget.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-navy-400 mb-1">Category</p>
                <span className="badge-navy">{viewTarget.category}</span>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">Department</p>
                <p className="text-navy-200 text-sm">{viewTarget.department}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">Status</p>
                <span className={STATUS_BADGE[viewTarget.status]}>{viewTarget.status}</span>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">From</p>
                <p className="text-navy-200 text-sm">
                  {viewTarget.is_anonymous ? <span className="italic text-navy-500">Anonymous</span> : viewTarget.submitted_by?.name ?? '—'}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <button onClick={() => { setViewTarget(null); setStatusTarget(viewTarget); setNewStatus(viewTarget.status) }}
                className="btn-secondary w-full">Change Status</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Status change modal */}
      <Modal open={!!statusTarget} onClose={() => setStatusTarget(null)} title="Update Feedback Status" size="sm">
        <p className="text-navy-300 text-sm mb-4">Update status for: <span className="text-white font-medium">{statusTarget?.title}</span></p>
        <select
          className="input mb-5"
          value={newStatus}
          onChange={e => setNewStatus(e.target.value)}
          aria-label={`Update status for ${statusTarget?.title}`} // <--- Added accessible name
        >
          <option value="Pending">Pending</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Resolved">Resolved</option>
        </select>
        <div className="flex gap-3">
          <button onClick={() => setStatusTarget(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => { handleStatusChange(); setStatusTarget(null) }}
            className="btn-primary flex-1" style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}>
            Update
          </button>
        </div>
      </Modal>
    </div>
  )
}