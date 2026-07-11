import { useEffect, useState } from 'react'
import { MessageSquare, Plus, Loader2, Shield, Bell } from 'lucide-react'
import { feedbackAPI } from '../../api/feedback'
import type { Feedback, FeedbackCategory } from '../../types'
import { EmptyState, LoadingGrid, PageHeader } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

// ── CUEA feedback categories ──────────────────────────
const CATEGORIES: FeedbackCategory[] = [
  'Academic', 'Facilities', 'Administration',
  'Clubs', 'Events', 'Spiritual', 'Hostel', 'Other',
]

// ── CUEA departments ──────────────────────────────────
const DEPARTMENTS = [
  'Office of the Vice Chancellor',
  'Academic Registrar',
  'Student Affairs',
  'Finance & Accounts',
  'Library Services',
  'Health Services',
  'Security',
  'Maintenance & Facilities',
  'Faculty of Arts and Social Sciences',
  'Faculty of Commerce',
  'Faculty of Education',
  'Faculty of Law',
  'Faculty of Science',
  'Institute of Philosophy and Religious Studies',
  'School of Nursing',
  'Faculty of Music and Performing Arts',
  'ICT Department',
  'Other',
]

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Pending:  { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  Reviewed: { bg: 'rgba(59,130,246,0.15)', text: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
  Resolved: { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
}
const CAT_GRADIENT: Record<string, string> = {
  Academic:       'linear-gradient(135deg,#3b82f6,#c81e45)',
  Facilities:     'linear-gradient(135deg,#10b981,#06b6d4)',
  Administration: 'linear-gradient(135deg,#c81e45,#d4af37)',
  Clubs:          'linear-gradient(135deg,#d4af37,#a855f7)',
  Events:         'linear-gradient(135deg,#f59e0b,#ef4444)',
  Spiritual:      'linear-gradient(135deg,#f59e0b,#fbbf24)',
  Hostel:         'linear-gradient(135deg,#ec4899,#d4af37)',
  Other:          'linear-gradient(135deg,#64748b,#475569)',
}

function FeedbackCard({ item }: { item: Feedback }) {
  const s        = STATUS_STYLE[item.status] ?? STATUS_STYLE.Pending
  const gradient = CAT_GRADIENT[item.category] ?? CAT_GRADIENT.Other

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-fade-in"
      style={{ background: '#2e000b' }}>
      <div className="h-1.5" style={{ background: gradient }} />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-white text-sm leading-snug">{item.title}</h3>
              {/* Notification dot — admin has responded */}
              {item.notified && item.status !== 'Pending' && (
                <span title="Administrator has responded"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <Bell className="w-2.5 h-2.5" /> Updated
                </span>
              )}
            </div>
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
            {item.isAnonymous
              ? <><Shield className="w-3 h-3" /> Anonymous</>
              : <span>{item.submittedBy?.name ?? 'Student'}</span>}
          </div>
          <div className="flex items-center gap-2 text-right">
            {item.resolvedAt && (
              <span className="text-emerald-400 text-xs">
                Resolved {new Date(item.resolvedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </span>
            )}
            <span className="text-indigo-400 text-xs">
              {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          </div>
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
      setForm({ title: '', description: '', category: 'Academic', department: DEPARTMENTS[0], is_anonymous: false })
    } catch { toast.error('Failed to submit feedback') }
    finally { setLoading(false) }
  }

  const lbl = 'block text-xs text-slate-300 mb-1.5 font-medium'
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
        <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-primary-500/10 transition-colors"
          style={{ borderColor: 'rgba(200,30,69,0.3)', background: 'rgba(255,255,255,0.05)' }}>
          <input type="checkbox" checked={form.is_anonymous}
            onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
            className="w-4 h-4 accent-indigo-600" />
          <div>
            <p className="text-white text-xs font-medium">Submit anonymously</p>
            <p className="text-slate-400 text-xs">Your name won't be visible to administrators</p>
          </div>
          <Shield className="w-4 h-4 text-indigo-400 ml-auto shrink-0" />
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
  const [items, setItems]         = useState<Feedback[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)

  const notifiedCount = items.filter(i => i.notified && i.status !== 'Pending').length

  const load = async () => {
    setLoading(true)
    try { const res = await feedbackAPI.getAll(); setItems(res.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <PageHeader title="Feedback"
        subtitle="Submit feedback to CUEA departments and track responses"
        action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Give Feedback</button>}
      />

      {/* Notification banner if any feedback got a status update */}
      {notifiedCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-4"
          style={{ background: 'rgba(200,30,69,0.1)', border: '1px solid rgba(200,30,69,0.3)' }}>
          <Bell className="w-4 h-4 text-primary-400 shrink-0" />
          <p className="text-primary-300 text-xs leading-relaxed">
            {notifiedCount} of your feedback item{notifiedCount !== 1 ? 's have' : ' has'} received a response from an administrator.
          </p>
        </div>
      )}

      <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
        style={{ background: 'rgba(200,30,69,0.1)', border: '1px solid rgba(200,30,69,0.3)' }}>
        <Shield className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
        <p className="text-slate-300 text-xs leading-relaxed">
          Your feedback is reviewed by CUEA administrators. You may submit anonymously. All feedback is treated with confidentiality.
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