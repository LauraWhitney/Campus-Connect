import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ShoppingBag, Users, Search, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { eventsAPI } from '../../api/events'
import { marketplaceAPI } from '../../api/marketplace'
import { clubsAPI } from '../../api/clubs'
import type { Event, MarketplaceItem, Club } from '../../types'

// ── Single red brand style for every stat card — muted, not bright ──
const CARD_STYLE = { bg: 'linear-gradient(135deg, #4d0013 0%, #800022 100%)', shadow: '0 6px 20px rgba(77,0,19,0.3)' }

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  to: string
}

function StatCard({ icon, label, value, sub, to }: StatCardProps) {
  return (
    <Link
      to={to}
      className="rounded-2xl p-5 flex items-start gap-4 group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      style={{ background: CARD_STYLE.bg, boxShadow: CARD_STYLE.shadow }}
    >
      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white/70 text-xs font-medium">{label}</p>
        <p className="font-display text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
      </div>
      <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all mt-1 shrink-0" />
    </Link>
  )
}

function QuickEventCard({ event }: { event: Event }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary-500/10 border border-primary-500/20 flex flex-col items-center justify-center shrink-0">
        <span className="text-primary-300 text-xs font-bold leading-none">{new Date(event.date).getDate()}</span>
        <span className="text-primary-400 text-[10px] uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{event.title}</p>
        <p className="text-slate-400 text-xs">{event.venue} · {event.time}</p>
      </div>
      <span className="badge-brand shrink-0 text-[10px]">{event.category}</span>
    </div>
  )
}

function QuickItemCard({ item }: { item: MarketplaceItem }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
        <ShoppingBag className="w-4 h-4 text-primary-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{item.title}</p>
        <p className="text-slate-400 text-xs">{item.condition} · {item.category}</p>
      </div>
      <span className="text-primary-300 text-sm font-semibold shrink-0">${Number(item.price).toLocaleString()}</span>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [items, setItems]   = useState<MarketplaceItem[]>([])
  const [clubs, setClubs]   = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([eventsAPI.getAll(), marketplaceAPI.getAll(), clubsAPI.getAll()])
      .then(([ev, mk, cl]) => {
        setEvents(ev.data.slice(0, 3))
        setItems(mk.data.slice(0, 3))
        setClubs(cl.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-wrapper max-w-5xl mx-auto space-y-6">

      {/* ── Hero greeting card — indigo → purple gradient ── */}
      <div
        className="rounded-2xl p-7 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #a0002a 0%, #c81e45 55%, #d4af37 100%)',
          boxShadow: '0 12px 40px rgba(200,30,69,0.4)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative">
          <p className="text-white/70 text-sm font-medium">{greeting},</p>
          <h2 className="font-display text-4xl font-bold text-white mt-1 tracking-tight">
            {user?.name?.split(' ')[0]} 👋
          </h2>
          {user?.faculty && (
            <p className="text-white/60 text-sm mt-1">{user.faculty}</p>
          )}
          <p className="text-white/80 text-sm mt-3">
            Your campus life hub is ready.
          </p>

          {/* Quick stats row */}
          <div className="flex gap-6 mt-5 pt-5 border-t border-white/20">
            <div>
              <p className="text-white font-bold text-xl leading-none">{events.length || '—'}</p>
              <p className="text-white/60 text-xs mt-0.5">Events</p>
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-none">{clubs.length || '—'}</p>
              <p className="text-white/60 text-xs mt-0.5">Clubs</p>
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-none capitalize">{user?.role}</p>
              <p className="text-white/60 text-xs mt-0.5">
                {user?.yearOfStudy ? `Year ${user.yearOfStudy}` : 'Role'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards — alternating blue→purple gradients ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          to="/app/events"
          icon={<Calendar className="w-5 h-5 text-white" />}
          label="Upcoming Events" value={events.length || '—'} sub="This week"
        />
        <StatCard
          to="/app/marketplace"
          icon={<ShoppingBag className="w-5 h-5 text-white" />}
          label="Marketplace" value={items.length || '—'} sub="Available now"
        />
        <StatCard
          to="/app/clubs"
          icon={<Users className="w-5 h-5 text-white" />}
          label="Active Clubs" value={loading ? '—' : clubs.length} sub="Join one today"
        />
        <StatCard
          to="/app/lost-found"
          icon={<Search className="w-5 h-5 text-white" />}
          label="Lost & Found" value="Reports" sub="Help your peers"
        />
        <StatCard
          to="/app/feedback"
          icon={<MessageSquare className="w-5 h-5 text-white" />}
          label="Feedback" value="Departments" sub="Your voice matters"
        />
        <StatCard
          to="/app/events"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          label="Your Role" value={user?.role ?? '—'}
          sub={user?.yearOfStudy ? `Year ${user.yearOfStudy}` : 'Campus Connect'}
        />
      </div>

      {/* ── Two-column: events + marketplace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Upcoming events */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-white">Upcoming Events</h3>
            <Link to="/app/events" className="text-primary-300 text-xs hover:text-primary-200 flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : events.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No upcoming events</p>
          ) : (
            <div className="space-y-1">
              {events.map(e => <QuickEventCard key={e._id} event={e} />)}
            </div>
          )}
        </div>

        {/* Recent marketplace listings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-white">Marketplace</h3>
            <Link to="/app/marketplace" className="text-primary-300 text-xs hover:text-primary-200 flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No listings yet</p>
          ) : (
            <div className="space-y-1">
              {items.map(i => <QuickItemCard key={i._id} item={i} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}