import { useState, type FormEvent } from 'react'
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAdminAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error(msg === 'Admin access required' ? 'This account does not have admin privileges.' : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg,#060e1a 0%,#0d1f3c 45%,#1a2f5a 100%)' }}>

      {/* Decorative */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-navy-600/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#f0c040)', boxShadow: '0 0 40px rgba(212,175,55,0.4)' }}>
            <ShieldCheck className="w-8 h-8 text-navy-900" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Admin Panel</h1>
          <p className="text-navy-400 text-sm mt-1">Campus Connect · CUEA</p>
        </div>

        <div className="bg-navy-800/70 backdrop-blur-md border border-navy-600/40 rounded-2xl p-7 shadow-navy">
          {/* Restricted banner */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 mb-5">
            <ShieldCheck className="w-4 h-4 text-gold-400 shrink-0" />
            <p className="text-gold-300 text-xs">Restricted to administrators only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-navy-300 mb-1.5 font-medium">Admin Email</label>
              <input type="email" className="input" placeholder="admin@cuea.edu"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-navy-300 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10"
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In to Admin Panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-navy-600 text-xs mt-4">
          Campus Connect v1.0.0 · CUEA Internal System
        </p>
      </div>
    </div>
  )
}
