import { useEffect, useState } from 'react'
import { MessageSquare, Plus, Loader2, Shield } from 'lucide-react'
import { feedbackAPI } from '../../api/feedback'
import type { Feedback, FeedbackCategory } from '../../types'
import { EmptyState, LoadingGrid, PageHeader } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const CATEGORIES: FeedbackCategory[] = ['Academic', 'Facilities', 'Administration', 'Clubs', 'Events', 'Other']
const DEPARTMENTS = [
  'Department of Computer Science', 'Student Affairs', 'Finance', 'Library',
  'Health Services', 'Security', 'Maintenance', 'Academic Registrar', 'Other',
]

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Pending:  { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  Reviewed: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  Resolved: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
}
const CAT_GRADIENT: Record<string, string> = {
  Academic:       'linear-gradient(135deg,#3b82f6,#6366f1)',
  Facilities:     'linear-gradient(135deg,#10b981,#06b6d4)',
  Administration: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  Clubs:          'linear-gradient(135deg,#8b5cf6,#a855f7)',
  Events:         'linear-gradient(135deg,#f59e0b,#ef4444)',
  Other:          'linear-gradient(135deg,#64748b,#475569)',
}

function FeedbackCard({ item }: { item: Feedback }) {
  const s = STATUS_STYLE[item.status] ?? STATUS_STYLE.Pending
  const gradient = CAT_GRADIENT[item.category] ?? CAT_GRADIENT.Other

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-fade-in"
      style={{ background: '#1e1b4b' }}>
      <div className="h-1.5" style={{ background: gradient }} />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-white text-sm leading-snug">{item.title}</h3>
            <p className="text-indigo-300 text-xs mt-0.5">{item.department}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
              style={{ background: s.bg, color: s.text, borderColor: s.border }}>{item.status}</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: gradient }} />
              <span className="text-indigo-300 text-[10px]">{item.category}</span>
            </div>
          </div>
        </div>

        <p className="text-slate-300 text-xs line-clamp-3 leading-relaxed">{item.description}</p>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs">
            {item.isAnonymous ? <><Shield className="w-3 h-3" /> Anonymous</> : <span>{item.submittedBy?.name ?? 'Student'}</span>}
          </div>
          <span className="text-indigo-400 text-xs">
            {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
    </div>
  )
}

function SubmitFeedbackModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', category: 'Academic' as FeedbackCategory,
    department: DEPARTMENTS[0], is_anonymous: false,
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await feedbackAPI.submit(form)
      toast.success('Feedback submitted. Thank you!')
      onCreated()
      onClose()
      setForm({ title: '', description: '', category: 'Academic', department: DEPARTMENTS[0], is_anonymous: false })
    } catch { toast.error('Failed to submit feedback') }
    finally { setLoading(false) }
  }

  const lbl = 'block text-xs text-slate-600 mb-1.5 font-medium'
  return (
    <Modal open={open} onClose={onClose} title="Submit Feedback">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="fb-title" className={lbl}>Title</label>
          <input id="fb-title" className="input" value={form.title} onChange={set('title')} required placeholder="Brief summary" maxLength={200} /></div>
        <div><label htmlFor="fb-desc" className={lbl}>Feedback</label>
          <textarea id="fb-desc" className="input min-h-[100px] resize-none" value={form.description} onChange={set('description')} required placeholder="Describe your feedback in detail…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="fb-cat" className={lbl}>Category</label>
            <select id="fb-cat" className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select></div>
          <div><label htmlFor="fb-dept" className={lbl}>Department</label>
            <select id="fb-dept" className="input" value={form.department} onChange={set('department')}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select></div>
        </div>
        <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-primary-50 transition-colors"
          style={{ borderColor: '#c7d2fe', background: '#eef2ff' }}>
          <input type="checkbox" checked={form.is_anonymous}
            onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
            className="w-4 h-4 accent-indigo-600" />
          <div>
            <p className="text-slate-800 text-xs font-medium">Submit anonymously</p>
            <p className="text-slate-500 text-xs">Your name won't be visible to administrators</p>
          </div>
          <Shield className="w-4 h-4 text-indigo-500 ml-auto shrink-0" />
        </label>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Feedback
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function FeedbackPage() {
  const [items, setItems]       = useState<Feedback[]>([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const res = await feedbackAPI.getAll(); setItems(res.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader title="Feedback" subtitle="Submit feedback to departments and track responses"
        action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Give Feedback</button>}
      />
      <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
        style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
        <Shield className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <p className="text-indigo-800 text-xs leading-relaxed">
          Your feedback is reviewed by university administrators. You may submit anonymously. All feedback is treated with confidentiality.
        </p>
      </div>
      {loading ? <LoadingGrid count={4} /> : items.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No feedback yet" subtitle="Submit your first piece of feedback."
          action={<button onClick={() => setShowModal(true)} className="btn-primary">Give Feedback</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(i => <FeedbackCard key={i._id} item={i} />)}
        </div>
      )}
      <SubmitFeedbackModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
    </div>
  )
}
