import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl' }

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          'relative w-full bg-navy-800 border border-navy-600/60 rounded-2xl shadow-navy',
          'animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hidden',
          sizes[size],
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700/50">
          <h2 className="font-display text-lg font-semibold text-white">{title}</h2>

          {/* ✅ FIXED */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            title="Close modal"
            className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}