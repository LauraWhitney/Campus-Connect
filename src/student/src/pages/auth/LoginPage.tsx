import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #060e1a 0%, #0d1f3c 45%, #1a2f5a 100%)' }}>

      {/* Decorative blobs */}
      <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-navy-600/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-gold-lg"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#f0c040)' }}>
            <GraduationCap className="w-7 h-7 text-navy-900" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Campus Connect</h1>
          <p className="text-navy-400 text-sm mt-1">CUEA Student Platform</p>
        </div>

        {/* Card */}
        <div className="bg-navy-800/70 backdrop-blur-md border border-navy-600/40 rounded-2xl p-7 shadow-navy">
          <h2 className="font-display text-lg font-semibold text-white mb-5">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-navy-300 mb-1.5 font-medium">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="student@cuea.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-navy-300 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-navy-400 text-xs mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
