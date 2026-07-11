import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap, Menu, X, ArrowRight, Calendar, ShoppingBag,
  Users, Search, MessageSquare, Shield, Star, Mail, Phone,
  MapPin, ChevronRight, CheckCircle2, Sparkles, Globe,
  BookOpen, Heart, Zap, Clock, Award, TrendingUp, Loader2, AlertTriangle,
} from 'lucide-react'
import { contactAPI } from '../../api/contact'
import toast from 'react-hot-toast'

// ── Smooth scroll helper ───────────────────────────────
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ── Animated counter ──────────────────────────────────
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = Math.ceil(target / 60)
      const timer = setInterval(() => {
        start += step
        if (start >= target) { setCount(target); clearInterval(timer) }
        else setCount(start)
      }, 20)
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ── Navbar ─────────────────────────────────────────────
function Navbar() {
  const [open, setOpen]         = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'backdrop-blur-xl border-b border-white/10' : ''
    }`}
    style={scrolled ? { background: 'rgba(2,6,23,0.85)' } : {}}>
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-base leading-none">CUEA Campus</span>
            <span className="font-display font-bold leading-none ml-1"
              style={{ background: 'linear-gradient(90deg,#c81e45,#e9ba3f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Connect
            </span>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7">
          {['features', 'about', 'stats', 'contact'].map(id => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-slate-300 hover:text-white text-sm font-medium capitalize transition-colors">
              {id === 'stats' ? 'Community' : id}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login"
            className="text-slate-300 hover:text-white text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
            Sign In
          </Link>
          <Link to="/login"
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(o => !o)} className="md:hidden text-white p-1.5">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 px-5 pb-5 pt-3 space-y-1"
          style={{ background: 'rgba(2,6,23,0.97)' }}>
          {['features', 'about', 'stats', 'contact'].map(id => (
            <button key={id} onClick={() => { scrollTo(id); setOpen(false) }}
              className="block w-full text-left text-slate-300 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm capitalize transition-colors">
              {id === 'stats' ? 'Community' : id}
            </button>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link to="/login" onClick={() => setOpen(false)}
              className="text-center text-sm font-medium text-slate-300 border border-white/10 px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all">
              Sign In
            </Link>
            <Link to="/login" onClick={() => setOpen(false)}
              className="text-center text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Hero ───────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{ background: 'linear-gradient(160deg,#020617 0%,#0f172a 50%,#2e000b 100%)' }}>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle,#c81e45,transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle,#d4af37,transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-5"
          style={{ background: 'radial-gradient(circle,#a0002a,transparent)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#c81e45 1px,transparent 1px),linear-gradient(90deg,#c81e45 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(200,30,69,0.15)', border: '1px solid rgba(200,30,69,0.3)', color: '#f5cd6b' }}>
          <Sparkles className="w-3.5 h-3.5" />
          Exclusively for CUEA Students & Staff
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-none tracking-tight mb-6">
          Your Campus.{' '}
          <span style={{ background: 'linear-gradient(90deg,#c81e45,#e9ba3f,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Connected.
          </span>
        </h1>

        <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          The all-in-one platform for the Catholic University of Eastern Africa community —
          events, marketplace, clubs, lost &amp; found, and more, all in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-105 hover:shadow-2xl w-full sm:w-auto justify-center"
            style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)', boxShadow: '0 0 40px rgba(200,30,69,0.4)' }}>
            Get Started Free <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => scrollTo('features')}
            className="flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl text-base transition-all duration-200 hover:bg-white/10 w-full sm:w-auto justify-center"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0' }}>
            Explore Features <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-14">
          {[
            { icon: Shield, text: 'CUEA emails only' },
            { icon: Globe,  text: 'Always online' },
            { icon: Heart,  text: 'Student-first' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 text-xs font-medium">{text}</span>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
          <div className="w-px h-10 rounded-full" style={{ background: 'linear-gradient(to bottom,rgba(200,30,69,0),rgba(200,30,69,0.8))' }} />
        </div>
      </div>
    </section>
  )
}

// ── Features ───────────────────────────────────────────
const FEATURES = [
  {
    icon: Calendar, gradient: 'linear-gradient(135deg,#3b82f6,#c81e45)',
    title: 'Campus Events',
    desc: 'Discover academic, spiritual, sports and social events. RSVP instantly and check in on the day — attendance is tracked automatically.',
    pills: ['RSVP', 'Check-In', 'Capacity Limits'],
  },
  {
    icon: ShoppingBag, gradient: 'linear-gradient(135deg,#d4af37,#a855f7)',
    title: 'Student Marketplace',
    desc: 'Buy and sell textbooks, lab equipment, hostel items and more with fellow CUEA students. Buyer tracking, sold status and secure contact all built in.',
    pills: ['Books', 'Lab Equipment', 'Hostel Items'],
  },
  {
    icon: Users, gradient: 'linear-gradient(135deg,#10b981,#06b6d4)',
    title: 'Clubs & Societies',
    desc: 'Explore and join CUEA\'s clubs — from the Catholic Ministry and Law Society to the Tech Club. Join with one tap and get meeting schedules.',
    pills: ['Catholic Ministry', 'Law Society', 'Tech Club'],
  },
  {
    icon: Search, gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    title: 'Lost & Found',
    desc: 'Report a lost item or claim something you found on campus. The claimant is recorded, status updates to Claimed automatically, and the reporter is notified.',
    pills: ['Report Lost', 'Mark Found', 'Claim Items'],
  },
  {
    icon: MessageSquare, gradient: 'linear-gradient(135deg,#ec4899,#d4af37)',
    title: 'Feedback Portal',
    desc: 'Submit anonymous or named feedback to any CUEA department. Administrators can update status and mark your feedback as reviewed or resolved.',
    pills: ['Anonymous', 'Track Status', 'Admin Response'],
  },
  {
    icon: Shield, gradient: 'linear-gradient(135deg,#c81e45,#0ea5e9)',
    title: 'CUEA-Only Access',
    desc: 'Registration is restricted to @cuea.edu email addresses, keeping the platform safe, trusted, and exclusively for our community.',
    pills: ['Verified Emails', 'Admin Panel', 'Activity Logs'],
  },
]

function Features() {
  return (
    <section id="features" className="py-24 px-5"
      style={{ background: '#0a0e1a' }}>
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(200,30,69,0.1)', border: '1px solid rgba(200,30,69,0.2)', color: '#f5cd6b' }}>
            <Zap className="w-3 h-3" /> Platform Features
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Everything your campus needs
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Six powerful modules built specifically for the CUEA community — no generic tools, no unnecessary clutter.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, gradient, title, desc, pills }) => (
            <div key={title}
              className="group relative rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-default"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,30,69,0.35)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow  = '0 0 40px rgba(200,30,69,0.1)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow  = 'none'
              }}>
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: gradient }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
              {/* Pills */}
              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {pills.map(pill => (
                  <span key={pill} className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(200,30,69,0.15)', color: '#f5cd6b', border: '1px solid rgba(200,30,69,0.2)' }}>
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── About ──────────────────────────────────────────────
const ABOUT_POINTS = [
  { icon: BookOpen, title: 'Academic Excellence',  desc: 'Built to complement CUEA\'s mission of holistic education by connecting students to academic resources, events and clubs.' },
  { icon: Heart,    title: 'Faith & Community',    desc: 'Rooted in Catholic values, Campus Connect honours the spiritual dimension of campus life with a dedicated ministry hub.' },
  { icon: Zap,      title: 'Modern Technology',    desc: 'A fast, mobile-friendly platform built with React and FastAPI — designed to work anywhere on or off campus.' },
  { icon: Award,    title: 'Student-Led Design',   desc: 'Every feature was designed around real student needs — from hostel item sales to anonymous feedback for management.' },
]

function About() {
  return (
    <section id="about" className="py-24 px-5"
      style={{ background: 'linear-gradient(180deg,#0a0e1a 0%,#0f172a 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(200,30,69,0.1)', border: '1px solid rgba(200,30,69,0.2)', color: '#f5cd6b' }}>
              <Star className="w-3 h-3" /> About CUEA Campus Connect
            </div>
            <h2 className="font-display text-4xl font-extrabold text-white mb-6 leading-tight">
              Built for CUEA.<br />
              <span style={{ background: 'linear-gradient(90deg,#c81e45,#e9ba3f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Designed with purpose.
              </span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-5">
              CUEA Campus Connect is a dedicated digital platform for the Catholic University of Eastern Africa community in Lang'ata, Nairobi. It brings together students, lecturers and administrators in one verified, secure space.
            </p>
            <p className="text-slate-400 leading-relaxed mb-8">
              Unlike generic social platforms, every feature here is purpose-built for campus life — from tracking who claimed a found item, to confirming event attendance, to submitting feedback directly to the right department.
            </p>
            <Link to="/login"
              className="inline-flex items-center gap-2 font-semibold text-sm text-white px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
              Join the Community <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Points grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ABOUT_POINTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-display font-semibold text-white text-sm mb-2">{title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Stats / Community ──────────────────────────────────
const STATS = [
  { value: 3200, suffix: '+', label: 'Registered Students',  icon: Users,       color: '#c81e45' },
  { value: 120,  suffix: '+', label: 'Events Hosted',        icon: Calendar,    color: '#d4af37' },
  { value: 45,   suffix: '',  label: 'Active Clubs',         icon: Heart,       color: '#ec4899' },
  { value: 98,   suffix: '%', label: 'Issue Resolution Rate', icon: CheckCircle2, color: '#10b981' },
]

function Stats() {
  return (
    <section id="stats" className="py-24 px-5"
      style={{ background: 'linear-gradient(135deg,#2e000b 0%,#0f172a 60%,#2e000b 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(200,30,69,0.15)', border: '1px solid rgba(200,30,69,0.25)', color: '#f5cd6b' }}>
            <TrendingUp className="w-3 h-3" /> Our Community in Numbers
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-4">
            A growing campus community
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Thousands of CUEA community members already use Campus Connect every day.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map(({ value, suffix, label, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-7 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `${color}25` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <div className="font-display text-4xl font-extrabold text-white mb-2">
                <Counter target={value} suffix={suffix} />
              </div>
              <p className="text-slate-400 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Testimonial strip */}
        <div className="mt-16 grid sm:grid-cols-3 gap-4">
          {[
            { quote: 'Found my stolen backpack within an hour of posting it on the lost & found page.', name: 'Amina K.', role: 'Year 2, Faculty of Law' },
            { quote: 'Sold all my Year 1 textbooks in two days. The marketplace is incredibly easy to use.', name: 'Brian M.', role: 'Year 3, Faculty of Commerce' },
            { quote: 'Our Tech Club membership doubled after we listed on Campus Connect.', name: 'Cynthia W.', role: 'President, CUEA Tech Club' },
          ].map(({ quote, name, role }) => (
            <div key={name} className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 italic">"{quote}"</p>
              <div>
                <p className="text-white text-xs font-semibold">{name}</p>
                <p className="text-slate-500 text-xs">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ───────────────────────────────────────
const STEPS = [
  { step: '01', icon: Mail,          title: 'Sign up with your CUEA email', desc: 'Register using your @cuea.edu email. No other emails are accepted — keeping the community verified.' },
  { step: '02', icon: Globe,         title: 'Explore your campus',          desc: 'Browse events, join clubs, browse the marketplace, and report lost items — all from your dashboard.' },
  { step: '03', icon: CheckCircle2,  title: 'Take action',                  desc: 'RSVP to events and check in, buy or sell items, join clubs, submit feedback, and track every update in real time.' },
  { step: '04', icon: TrendingUp,    title: 'Stay connected',               desc: 'Get notified when your feedback is reviewed, when your item is claimed, or when your club has new members.' },
]

function HowItWorks() {
  return (
    <section className="py-24 px-5" style={{ background: '#080c18' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(200,30,69,0.1)', border: '1px solid rgba(200,30,69,0.2)', color: '#f5cd6b' }}>
            <Clock className="w-3 h-3" /> How It Works
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-4">Up and running in minutes</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Four simple steps to get the most out of Campus Connect.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ step, icon: Icon, title, desc }, idx) => (
            <div key={step} className="relative">
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px z-0"
                  style={{ background: 'linear-gradient(to right,rgba(200,30,69,0.4),transparent)' }} />
              )}
              <div className="relative z-10 rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="font-display text-4xl font-black mb-4 block"
                  style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {step}
                </span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(200,30,69,0.15)', border: '1px solid rgba(200,30,69,0.2)' }}>
                  <Icon className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <h4 className="font-display font-semibold text-white text-sm mb-2">{title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Contact ────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      await contactAPI.submit(form)
      setSent(true)
      toast.success("Message sent — we'll be in touch shortly.")
      setTimeout(() => { setSent(false); setForm({ name: '', email: '', message: '' }) }, 4000)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ')
        : detail || 'Failed to send your message. Please try again in a moment.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const lbl = 'block text-xs text-indigo-300 mb-2 font-semibold uppercase tracking-wider'
  const inp = 'w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/30'

  return (
    <section id="contact" className="py-24 px-5"
      style={{ background: 'linear-gradient(180deg,#0a0e1a 0%,#0f172a 100%)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(200,30,69,0.1)', border: '1px solid rgba(200,30,69,0.2)', color: '#f5cd6b' }}>
            <Mail className="w-3 h-3" /> Get in Touch
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-4">Contact Us</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Have a question, issue or suggestion? We're here to help.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Contact info */}
          <div className="space-y-6">
            {[
              { icon: MapPin, label: 'Physical Address',  value: 'Langata South Road, Lang\'ata, Nairobi, Kenya\nP.O. Box 62157-00200' },
              { icon: Phone,  label: 'Phone',             value: '+254 20 891 601–8' },
              { icon: Mail,   label: 'Email',             value: 'info@cuea.edu' },
              { icon: Globe,  label: 'Website',           value: 'www.cuea.edu' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(200,30,69,0.15)', border: '1px solid rgba(200,30,69,0.2)' }}>
                  <Icon className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{value}</p>
                </div>
              </div>
            ))}

            {/* Campus hours */}
            <div className="rounded-2xl p-5 mt-4"
              style={{ background: 'rgba(200,30,69,0.08)', border: '1px solid rgba(200,30,69,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                <p className="text-indigo-300 font-semibold text-sm">Platform Support Hours</p>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Monday – Friday: 8:00 AM – 6:00 PM<br />
                Saturday: 9:00 AM – 1:00 PM<br />
                Sunday & Public Holidays: Closed
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-2xl p-8"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.2)' }}>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-white font-semibold text-lg">Message Sent!</p>
                <p className="text-slate-400 text-sm text-center">Thanks for reaching out. We'll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs leading-relaxed">{errorMsg}</p>
                  </div>
                )}
                <div>
                  <label className={lbl}>Full Name</label>
                  <input className={inp} value={form.name} onChange={set('name')} required placeholder="Your full name"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className={lbl}>Email Address</label>
                  <input type="email" className={inp} value={form.email} onChange={set('email')} required placeholder="you@cuea.edu"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className={lbl}>Message</label>
                  <textarea className={`${inp} min-h-[130px] resize-none`} value={form.message} onChange={set('message')} required
                    placeholder="Tell us how we can help…"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
                  style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Send Message <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ─────────────────────────────────────────
function CTABanner() {
  const navigate = useNavigate()
  return (
    <section className="py-20 px-5"
      style={{ background: 'linear-gradient(135deg,#2e000b 0%,#4d0013 50%,#2e000b 100%)' }}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Ready to connect?
        </h2>
        <p className="text-indigo-200 text-lg mb-10">
          Join thousands of CUEA students and staff already using Campus Connect.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-white font-bold px-10 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-105 w-full sm:w-auto justify-center"
            style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)', boxShadow: '0 0 50px rgba(200,30,69,0.5)' }}>
            Get Started Now <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => scrollTo('contact')}
            className="flex items-center gap-2 font-semibold px-10 py-4 rounded-2xl text-base transition-all duration-200 hover:bg-white/10 w-full sm:w-auto justify-center"
            style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fdf3d6' }}>
            Contact Us
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────
function Footer() {
  const LINKS = {
    Platform:  ['Events', 'Marketplace', 'Clubs', 'Lost & Found', 'Feedback'],
    University:['About CUEA', 'Faculties', 'Admissions', 'Research', 'Alumni'],
    Support:   ['Help Centre', 'Privacy Policy', 'Terms of Use', 'Accessibility'],
  }

  return (
    <footer style={{ background: '#020617' }}>
      <div className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white text-sm">CUEA Campus Connect</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-5">
              The official digital platform for the Catholic University of Eastern Africa community in Nairobi, Kenya.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-500 text-xs">Platform online</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-display font-semibold text-white text-sm mb-5">{heading}</h4>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-slate-500 text-xs hover:text-indigo-400 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Catholic University of Eastern Africa. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-slate-600 text-xs">Made with ✝️ for the CUEA Community</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Page ───────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <Hero />
      <Features />
      <About />
      <Stats />
      <HowItWorks />
      <Contact />
      <CTABanner />
      <Footer />
    </div>
  )
}