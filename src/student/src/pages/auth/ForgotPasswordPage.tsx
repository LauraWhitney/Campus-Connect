import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Loader2, ArrowLeft, CheckCircle2, Copy } from 'lucide-react'
import api from '../../api/index'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState<'request' | 'token' | 'reset' | 'done'>('request')
  const [token, setToken]     = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })

      // Prototype returns token directly
      if (data.reset_token) {
        setResetToken(data.reset_token)
        setToken(data.reset_token) // auto-fill token
        setStep('token')
      }

      toast.success('Reset token generated!')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const checks = [
      newPassword.length >= 8,
      /[A-Z]/.test(newPassword),
      /[a-z]/.test(newPassword),
      /\d/.test(newPassword)
    ]

    if (!checks.every(Boolean)) {
      toast.error('Password does not meet requirements')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword
      })

      setStep('done')
      toast.success('Password reset successfully!')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid or expired token.')
    } finally {
      setLoading(false)
    }
  }

  const containerCls = "min-h-screen flex items-center justify-center px-4"
  const cardCls = "bg-surface-800/70 backdrop-blur-md border border-surface-700/40 rounded-2xl p-7 shadow-card w-full max-w-sm"

  return (
    <div
      className={containerCls}
      style={{ background: 'linear-gradient(160deg, #020617 0%, #0f172a 45%, #1e1b4b 100%)' }}
    >

      <div
        className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.08)' }}
      />

      <div className="relative w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-brand-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <GraduationCap className="w-7 h-7 text-white" />
          </div>

          <h1 className="font-display text-2xl font-bold text-white">
            Campus Connect
          </h1>
        </div>

        {/* STEP 1 */}
        {step === 'request' && (
          <div className={cardCls}>
            <h2 className="font-display text-lg font-semibold text-white mb-1">
              Forgot Password
            </h2>

            <p className="text-surface-400 text-xs mb-5">
              Enter your email and we'll generate a reset token.
            </p>

            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 font-medium">
                  Email address
                </label>

                <input
                  type="email"
                  className="input"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Generating…' : 'Get Reset Token'}
              </button>
            </form>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-primary-400 hover:text-primary-300 text-xs mt-5 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Sign In
            </Link>
          </div>
        )}

        {/* STEP 2 */}
        {step === 'token' && (
          <div className={cardCls}>
            <h2 className="font-display text-lg font-semibold text-white mb-1">
              Your Reset Token
            </h2>

            <p className="text-surface-400 text-xs mb-4">
              In production this is sent by email. Copy this token and paste it below.
            </p>

            <div
              className="flex items-center gap-2 p-3 rounded-xl mb-5"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)'
              }}
            >
              <code className="text-primary-300 text-xs flex-1 break-all">
                {resetToken}
              </code>

              <button
                type="button"
                aria-label="Copy reset token"
                title="Copy reset token"
                onClick={() => {
                  navigator.clipboard.writeText(resetToken)
                  toast.success('Copied!')
                }}
                className="text-primary-400 hover:text-white transition-colors shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 font-medium">
                  Paste Token
                </label>

                <input
                  className="input"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Paste token here"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep('reset')}
                disabled={!token.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                Continue to Reset
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 'reset' && (
          <div className={cardCls}>
            <h2 className="font-display text-lg font-semibold text-white mb-1">
              Set New Password
            </h2>

            <p className="text-surface-400 text-xs mb-5">
              Choose a strong password for your account.
            </p>

            <form onSubmit={handleReset} className="space-y-4">

              <div>
                <label className="block text-xs text-surface-400 mb-1.5 font-medium">
                  New Password
                </label>

                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="Min. 8 chars, uppercase, number"
                />
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1.5 font-medium">
                  Confirm Password
                </label>

                <input
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>

            </form>
          </div>
        )}

        {/* STEP 4 */}
        {step === 'done' && (
          <div className={cardCls}>
            <div className="flex flex-col items-center text-center gap-4 py-4">

              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>

              <h2 className="font-display text-lg font-semibold text-white">
                Password Reset!
              </h2>

              <p className="text-surface-400 text-xs">
                Your password has been updated successfully.
              </p>

              <Link to="/login" className="btn-primary px-8 mt-2">
                Sign In
              </Link>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}