import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

// ── Empty State ────────────────────────────────────────
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-navy-700/60 border border-navy-600/40 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-navy-400" />
      </div>
      <h3 className="font-display text-base font-semibold text-white mb-1">{title}</h3>
      {subtitle && <p className="text-navy-400 text-sm max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Loading skeleton card ──────────────────────────────
function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="h-4 bg-navy-700 rounded-lg w-3/4" />
      <div className="h-3 bg-navy-700 rounded w-1/2" />
      <div className="h-3 bg-navy-700 rounded w-full" />
      <div className="h-3 bg-navy-700 rounded w-5/6" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-16 bg-navy-700 rounded-full" />
        <div className="h-6 w-20 bg-navy-700 rounded-full" />
      </div>
    </div>
  )
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

// ── Page header with optional button ──────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Filter chip bar ────────────────────────────────────
interface FilterBarProps {
  options: string[]
  active: string
  onChange: (v: string) => void
}

export function FilterBar({ options, active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
            ${active === opt
              ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
              : 'bg-navy-800/60 text-navy-300 border-navy-600/40 hover:text-white hover:border-navy-500'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
