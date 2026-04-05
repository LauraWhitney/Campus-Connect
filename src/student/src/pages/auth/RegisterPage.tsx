import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const FACULTIES = [
  'Faculty of Science', 'Faculty of Arts', 'Faculty of Commerce',
  'Faculty of Education', 'Faculty of Law', 'Faculty of Theology',
  'School of Nursing', 'School of Medicine',
]

export default function RegisterPage() {
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', faculty: '', year_of_study: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        faculty: form.faculty || undefined,

        // ✅ FIXED (camelCase)
        yearOfStudy: form.year_of_study
          ? Number(form.year_of_study)
          : undefined,
      })
    } catch {
      toast.error('Registration failed. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #060e1a 0%, #0d1f3c 45%, #1a2f5a 100%)' }}
    >
      <div className="absolute top-20 right-1/3 w-72 h-72 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-gold-lg"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#f0c040)' }}
          >
            <GraduationCap className="w-7 h-7 text-navy-900" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Campus Connect</h1>
          <p className="text-navy-400 text-sm mt-1">Create your student account</p>
        </div>

        <div className="bg-navy-800/70 backdrop-blur-md border border-navy-600/40 rounded-2xl p-7 shadow-navy">
          <h2 className="font-display text-lg font-semibold text-white mb-5">Register</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs text-navy-300 mb-1.5 font-medium">
                Full Name
              </label>
              <input
                id="name"
                className="input"
                placeholder="Jane Doe"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs text-navy-300 mb-1.5 font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="student@cuea.edu"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-navy-300 mb-1.5 font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set('password')}
                required
              />
            </div>

            <div>
              <label htmlFor="faculty" className="block text-xs text-navy-300 mb-1.5 font-medium">
                Faculty <span className="text-navy-500">(optional)</span>
              </label>

              {/* ✅ FIXED */}
              <select
                id="faculty"
                className="input"
                value={form.faculty}
                onChange={set('faculty')}
              >
                <option value="">Select faculty…</option>
                {FACULTIES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="year" className="block text-xs text-navy-300 mb-1.5 font-medium">
                Year of Study <span className="text-navy-500">(optional)</span>
              </label>

              {/* ✅ FIXED */}
              <select
                id="year"
                className="input"
                value={form.year_of_study}
                onChange={set('year_of_study')}
              >
                <option value="">Select year…</option>
                {[1, 2, 3, 4, 5].map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-navy-400 text-xs mt-5">
            Already registered?{' '}
            <Link
              to="/login"
              className="text-gold-400 hover:text-gold-300 transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}