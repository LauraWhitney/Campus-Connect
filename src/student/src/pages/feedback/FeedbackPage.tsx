import { useEffect, useState } from 'react'
import { MessageSquare, Plus, Loader2, Shield } from 'lucide-react'
import { feedbackAPI } from '../../api/feedback'
import type { Feedback, FeedbackCategory } from '../../types'
import { EmptyState, LoadingGrid, PageHeader } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const CATEGORIES: FeedbackCategory[] = ['Academic', 'Facilities', 'Administration', 'Clubs', 'Events', 'Other']
const DEPARTMENTS = ['Department of Computer Science', 'Student Affairs', 'Finance', 'Library', 'Health Services', 'Security', 'Maintenance', 'Academic Registrar', 'Other']

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Reviewed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

function FeedbackCard({ item }: { item: Feedback }) {
  return (
    <div className="card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-white text-sm leading-snug">{item.title}</h3>
          <p className="text-surface-400 text-xs mt-0.5">{item.department}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`badge border ${STATUS_STYLES[item.status]}`}>{item.status}</span>
          <span className="badge-surface">{item.category}</span>
        </div>
      </div>

      <p className="text-surface-300 text-xs line-clamp-3 leading-relaxed">{item.description}</p>

      <div className="flex items-center justify-between pt-1 border-t border-surface-700/40">
        <div className="flex items-center gap-1.5 text-surface-500 text-xs">
          {item.isAnonymous ? (
            <>
              <Shield className="w-3 h-3" /> Anonymous
            </>
          ) : (
            <span>{item.submittedBy?.name ?? 'Student'}</span>
          )}
        </div>

        <span className="text-surface-500 text-xs">
          {new Date(item.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}

function SubmitFeedbackModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Academic' as FeedbackCategory,
    department: DEPARTMENTS[0],
    is_anonymous: false
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await feedbackAPI.submit(form)
      toast.success('Feedback submitted. Thank you!')
      onCreated()
      onClose()
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Submit Feedback">
      <form onSubmit={handleSubmit} className="space-y-4 bg-blue-700 p-5 rounded-xl">

        <div>
          <label htmlFor="feedback-title" className="block text-xs text-surface-300 mb-1.5">
            Title
          </label>
          <input
            id="feedback-title"
            className="input"
            value={form.title}
            onChange={set('title')}
            required
            placeholder="Brief summary of your feedback"
          />
        </div>

        <div>
          <label htmlFor="feedback-description" className="block text-xs text-surface-300 mb-1.5">
            Feedback
          </label>
          <textarea
            id="feedback-description"
            className="input min-h-[100px] resize-none"
            value={form.description}
            onChange={set('description')}
            required
            placeholder="Describe your feedback in detail…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">

          <div>
            <label htmlFor="feedback-category" className="block text-xs text-surface-300 mb-1.5">
              Category
            </label>

            <select
              id="feedback-category"
              className="input"
              value={form.category}
              onChange={set('category')}
            >
              {CATEGORIES.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="feedback-department" className="block text-xs text-surface-300 mb-1.5">
              Department
            </label>

            <select
              id="feedback-department"
              className="input"
              value={form.department}
              onChange={set('department')}
            >
              {DEPARTMENTS.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl border border-surface-600/40 bg-surface-800/40 cursor-pointer hover:bg-surface-700/30 transition-colors">
          <input
            type="checkbox"
            checked={form.is_anonymous}
            onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
            className="w-4 h-4 accent-primary-400"
          />

          <div>
            <p className="text-white text-xs font-medium">Submit anonymously</p>
            <p className="text-surface-400 text-xs">Your name won't be visible to administrators</p>
          </div>

          <Shield className="w-4 h-4 text-surface-400 ml-auto shrink-0" />
        </label>

        <div className="flex gap-3 pt-1">
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
            Submit Feedback
          </button>
        </div>

      </form>
    </Modal>
  )
}

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await feedbackAPI.getAll()
      setItems(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="page-wrapper max-w-5xl mx-auto">

      <PageHeader
        title="Feedback"
        subtitle="Submit feedback to departments and track responses"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
            style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}
          >
            <Plus className="w-4 h-4" /> Give Feedback
          </button>
        }
      />

      <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-800/40 border border-surface-600/30 mb-6">
        <Shield className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
        <p className="text-surface-300 text-xs leading-relaxed">
          Your feedback is reviewed by university administrators. You may submit anonymously. All feedback is treated with confidentiality.
        </p>
      </div>

      {loading ? (
        <LoadingGrid count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback yet"
          subtitle="Submit your first piece of feedback."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
            >
              Give Feedback
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(i => (
            <FeedbackCard key={i._id} item={i} />
          ))}
        </div>
      )}

      <SubmitFeedbackModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={load}
      />

    </div>
  )
}