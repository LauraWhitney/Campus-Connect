import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const FACULTIES = [
  'Faculty of Science', 'Faculty of Arts', 'Faculty of Commerce',
  'Faculty of Education', 'Faculty of Law', 'Faculty of Theology',
  'School of Nursing', 'School of Medicine', 'School of Engineering',
  'Business School', 'School of Social Sciences',
]

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters',    ok: password.length >= 8 },
    { label: 'One uppercase letter',      ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter',      ok: /[a-z]/.test(password) },
    { label: 'One number',               ok: /\d/.test(password) },
  ]
  if (!password) return null
  const score = checks.filter(c => c.ok).length
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-surface-700'}`} />
        ))}
      </div>
      <div className="space-y-1">
        {checks.map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-1.5">
            {ok
              ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              : <XCircle className="w-3 h-3 text-surface-600 shrink-0" />}
            <span className={`text-[11px] ${ok ? 'text-emerald-400' : 'text-surface-500'}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
    const pwChecks = [
      form.password.length >= 8,
      /[A-Z]/.test(form.password),
      /[a-z]/.test(form.password),
      /\d/.test(form.password),
    ]
    if (!pwChecks.every(Boolean)) {
      toast.error('Please meet all password requirements')
      return
    }
    setLoading(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        faculty: form.faculty || undefined,
        yearOfStudy: form.year_of_study ? Number(form.year_of_study) : undefined,
      })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed. Try a different email.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #020617 0%, #0f172a 45%, #1e1b4b 100%)' }}
    >
      <div className="absolute top-20 right-1/3 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.08)' }} />

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-brand-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Campus Connect</h1>
          <p className="text-surface-400 text-sm mt-1">Create your student account</p>
        </div>

        <div className="bg-surface-800/70 backdrop-blur-md border border-surface-700/40 rounded-2xl p-7 shadow-card">
          <h2 className="font-display text-lg font-semibold text-white mb-5">Register</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs text-surface-400 mb-1.5 font-medium">Full Name</label>
              <input id="name" className="input" placeholder="Jane Doe"
                value={form.name} onChange={set('name')} required maxLength={120} />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs text-surface-400 mb-1.5 font-medium">Email</label>
              <input id="email" type="email" className="input" placeholder="you@university.edu"
                value={form.email} onChange={set('email')} required />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-surface-400 mb-1.5 font-medium">Password</label>
              <input id="password" type="password" className="input" placeholder="Min. 8 characters"
                value={form.password} onChange={set('password')} required />
              <PasswordStrength password={form.password} />
            </div>

            <div>
              <label htmlFor="faculty" className="block text-xs text-surface-400 mb-1.5 font-medium">
                Faculty <span className="text-surface-600">(optional)</span>
              </label>
              <select id="faculty" className="input" value={form.faculty} onChange={set('faculty')}>
                <option value="">Select faculty…</option>
                {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="year" className="block text-xs text-surface-400 mb-1.5 font-medium">
                Year of Study <span className="text-surface-600">(optional)</span>
              </label>
              <select id="year" className="input" value={form.year_of_study} onChange={set('year_of_study')}>
                <option value="">Select year…</option>
                {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-surface-400 text-xs mt-5">
            Already registered?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}