import { useState, useEffect, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ShieldCheck, Loader2, ArrowLeft, CheckCircle2, MailCheck } from 'lucide-react'
import api from '../../api/index'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState<'request' | 'sent' | 'reset' | 'done'>('request')
  const [token, setToken]     = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // A link from the reset email lands here with ?token=... — jump straight to step 3.
  useEffect(() => {
    const t = searchParams.get('token')
    if (t) {
      setToken(t)
      setStep('reset')
    }
  }, [searchParams])

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
        app_url: window.location.origin,
      })
      setStep('sent')
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

  const cardCls = "bg-surface-800/70 backdrop-blur-md border border-surface-700/40 rounded-2xl p-7 shadow-card"

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #020617 0%, #0f172a 45%, #2e000b 100%)' }}
    >
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(200,30,69,0.08)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(212,175,55,0.07)' }} />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-brand-lg"
            style={{ background: 'linear-gradient(135deg, #c81e45, #d4af37)' }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-surface-400 text-sm mt-1">Campus Connect</p>
        </div>

        {/* STEP 1 */}
        {step === 'request' && (
          <div className={cardCls}>
            <h2 className="font-display text-lg font-semibold text-white mb-1">
              Forgot Password
            </h2>
            <p className="text-surface-400 text-xs mb-5">
              Enter your admin email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 font-medium">Admin Email</label>
                <input
                  type="email" className="input" placeholder="admin@cuea.edu"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <Link to="/login"
              className="flex items-center justify-center gap-1.5 text-primary-400 hover:text-primary-300 text-xs mt-5 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </Link>
          </div>
        )}

        {/* STEP 2 — request sent */}
        {step === 'sent' && (
          <div className={cardCls}>
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                <MailCheck className="w-7 h-7 text-primary-400" />
              </div>
              <h2 className="font-display text-lg font-semibold text-white">Check Your Email</h2>
              <p className="text-surface-400 text-xs">
                If an admin account exists for <span className="text-surface-200">{email}</span>, a
                password reset link has been sent. It expires in 30 minutes.
              </p>
              <Link to="/login" className="text-primary-400 hover:text-primary-300 text-xs mt-2 transition-colors">
                Back to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 'reset' && (
          <div className={cardCls}>
            <h2 className="font-display text-lg font-semibold text-white mb-1">Set New Password</h2>
            <p className="text-surface-400 text-xs mb-5">Choose a strong password for your account.</p>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 font-medium">New Password</label>
                <input type="password" className="input" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} required
                  placeholder="Min. 8 chars, uppercase, number" />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 font-medium">Confirm Password</label>
                <input type="password" className="input" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required
                  placeholder="Repeat password" />
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
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
              <h2 className="font-display text-lg font-semibold text-white">Password Reset!</h2>
              <p className="text-surface-400 text-xs">Your password has been updated successfully.</p>
              <Link to="/login" className="btn-primary px-8 mt-2">Sign In</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
