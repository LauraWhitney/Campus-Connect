import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { cleanupAPI } from '../../api/admin'
import { Modal } from './index'
import toast from 'react-hot-toast'

/**
 * Dev-only "delete all test accounts" control.
 *
 * Safety layers:
 *  - Only rendered when the admin app itself is built/run in dev mode
 *    (import.meta.env.DEV) — never shipped in a production bundle.
 *  - The backend independently refuses the call outside `environment=development`,
 *    so even a stray production build calling this endpoint is a no-op.
 *  - Requires the admin to open a modal, review exactly which accounts would
 *    be deleted, and click a final destructive-styled confirm button.
 */
export function TestDataCleanup() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState<{ id: number; name: string; email: string }[] | null>(null)

  if (!import.meta.env.DEV) return null

  const openModal = async () => {
    setOpen(true)
    setLoading(true)
    setPreview(null)
    try {
      const res = await cleanupAPI.preview()
      setPreview(res.users)
    } catch {
      toast.error('Unable to load test accounts (cleanup may be disabled in this environment).')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const run = async () => {
    setRunning(true)
    try {
      const res = await cleanupAPI.run()
      toast.success(res.message)
      setOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to clean up test data')
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <button type="button" onClick={openModal}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition-colors"
        title="Development only — delete all test accounts and their data">
        <Trash2 className="w-3.5 h-3.5" /> Cleanup Test Data
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Cleanup Test Data" size="sm">
        <div className="flex items-start gap-2 p-3 rounded-xl mb-4 bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-200 text-xs leading-relaxed">
            This permanently deletes accounts whose email contains "test", or ends in
            @example.com / @test.cuea.edu — plus everything they created (events, clubs,
            feedback, etc). This only runs in development environments.
          </p>
        </div>

        {loading ? (
          <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
        ) : !preview || preview.length === 0 ? (
          <p className="text-surface-400 text-sm mb-4">No test accounts found. Nothing to clean up.</p>
        ) : (
          <div className="mb-4">
            <p className="text-surface-300 text-xs font-medium mb-2">{preview.length} account(s) will be deleted:</p>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {preview.map(u => (
                <div key={u.id} className="text-xs px-3 py-2 rounded-lg bg-surface-700/40 border border-surface-600/40">
                  <span className="text-white font-medium">{u.name}</span>{' '}
                  <span className="text-surface-400">— {u.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
          <button type="button" onClick={run} disabled={running || loading || !preview?.length}
            className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 disabled:opacity-40 flex items-center justify-center gap-2">
            {running && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Delete Test Data
          </button>
        </div>
      </Modal>
    </>
  )
}
