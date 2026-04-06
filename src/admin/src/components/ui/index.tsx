import { useEffect, type ReactNode } from 'react'
import { X, Inbox, type LucideIcon } from 'lucide-react'
import clsx from 'clsx'

// ── Modal ─────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}
const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx(
        'relative w-full bg-surface-800 border border-surface-600/60 rounded-2xl shadow-card',
        'animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hidden', SIZES[size],
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/50">
          <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────
interface ConfirmProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  danger?: boolean
}
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-surface-300 text-sm mb-5">{message}</p>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button
          type="button"
          onClick={() => { onConfirm(); onClose() }}
          className={clsx('flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all', danger
            ? 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30'
            : 'btn-primary')}
          style={!danger ? { background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' } : {}}
        >
          Confirm
        </button>
      </div>
    </Modal>
  )
}

// ── EmptyState ────────────────────────────────────────
export function EmptyState({ icon: Icon = Inbox, title, subtitle }: { icon?: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-700/60 border border-surface-600/40 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-surface-400" />
      </div>
      <p className="font-display text-base font-semibold text-white mb-1">{title}</p>
      {subtitle && <p className="text-surface-400 text-sm max-w-xs">{subtitle}</p>}
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-surface-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Table wrapper ─────────────────────────────────────
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </div>
  )
}

// ── Skeleton rows ─────────────────────────────────────
export function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead><tr className="border-b border-surface-700/40">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="th"><div className="h-3 bg-surface-700 rounded w-20 animate-pulse" /></th>
          ))}
        </tr></thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="table-row">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="td"><div className="h-3 bg-surface-700/60 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────
interface StatCardProps {
  icon: ReactNode
  label: string
  value: number | string
  delta?: string
  color: string
}
export function StatCard({ icon, label, value, delta, color }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>{icon}</div>
      <div>
        <p className="text-surface-400 text-xs font-medium">{label}</p>
        <p className="font-display text-2xl font-semibold text-white mt-0.5">{value}</p>
        {delta && <p className="text-xs text-emerald-400 mt-0.5">{delta}</p>}
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────
export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 rounded-lg text-xs text-surface-300 border border-surface-600/40 hover:border-primary-500/40 hover:text-primary-400 disabled:opacity-30 transition-all"
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
        <button
          type="button"
          key={p}
          onClick={() => onChange(p)}
          className={clsx('w-8 h-8 rounded-lg text-xs font-medium transition-all',
            p === page ? 'text-white font-semibold' : 'text-surface-300 border border-surface-600/40 hover:border-primary-500/40 hover:text-primary-400')}
          style={p === page ? { background: 'linear-gradient(90deg,#c9a84c,#f0c040)' } : {}}
          aria-label={`Go to page ${p}`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 rounded-lg text-xs text-surface-300 border border-surface-600/40 hover:border-primary-500/40 hover:text-primary-400 disabled:opacity-30 transition-all"
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  )
}