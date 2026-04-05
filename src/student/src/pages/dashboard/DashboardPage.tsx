import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ShoppingBag, Users, Search, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { eventsAPI } from '../../api/events'
import { marketplaceAPI } from '../../api/marketplace'
import { clubsAPI } from '../../api/clubs'
import type { Event, MarketplaceItem, Club } from '../../types'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  to: string
  color: string
}

function StatCard({ icon, label, value, sub, to, color }: StatCardProps) {
  return (
    <Link to={to} className="card p-5 flex items-start gap-4 group cursor-pointer">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-navy-400 text-xs font-medium">{label}</p>
        <p className="font-display text-2xl font-semibold text-white mt-0.5">{value}</p>
        {sub && <p className="text-navy-500 text-xs mt-0.5">{sub}</p>}
      </div>
      <ArrowRight className="w-4 h-4 text-navy-600 group-hover:text-gold-400 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
    </Link>
  )
}

function QuickEventCard({ event }: { event: Event }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-navy-700/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-navy-700/60 border border-navy-600/40 flex flex-col items-center justify-center shrink-0">
        <span className="text-gold-400 text-xs font-bold leading-none">{new Date(event.date).getDate()}</span>
        <span className="text-navy-400 text-[10px] uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
      </div>
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate">{event.title}</p>
        <p className="text-navy-400 text-xs">{event.venue} · {event.time}</p>
      </div>
      <span className="badge-gold shrink-0 text-[10px]">{event.category}</span>
    </div>
  )
}

function QuickItemCard({ item }: { item: MarketplaceItem }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy-700/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-navy-700/60 border border-navy-600/40 flex items-center justify-center shrink-0">
        <ShoppingBag className="w-4 h-4 text-navy-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{item.title}</p>
        <p className="text-navy-400 text-xs">{item.condition} · {item.category}</p>
      </div>
      <span className="text-gold-400 text-sm font-semibold shrink-0">KES {Number(item.price).toLocaleString()}</span>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([eventsAPI.getAll(), marketplaceAPI.getAll(), clubsAPI.getAll()])
      .then(([ev, mk, cl]) => { setEvents(ev.data.slice(0, 3)); setItems(mk.data.slice(0, 3)); setClubs(cl.data) })
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-wrapper max-w-5xl mx-auto space-y-6">
      {/* Hero greeting */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, #c9a84c22, #1e3a6e)' }} />
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-gold-500/10 blur-2xl" />
        <div className="relative">
          <p className="text-navy-300 text-sm font-body">{greeting},</p>
          <h2 className="font-display text-3xl font-semibold text-white mt-1">
            {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-navy-400 text-sm mt-2">
            {user?.faculty ? `${user.faculty} · ` : ''}Your campus life hub is ready.
          </p>
          <div className="flex gap-3 mt-4">
            <div className="h-px flex-1 bg-navy-700/60" />
            <div className="h-px w-12 bg-gold-shimmer" style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040)' }} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard to="/events" icon={<Calendar className="w-5 h-5 text-blue-300" />}
          label="Upcoming Events" value={events.length || '—'} sub="This week"
          color="bg-blue-500/15 border border-blue-500/20" />
        <StatCard to="/marketplace" icon={<ShoppingBag className="w-5 h-5 text-emerald-300" />}
          label="Marketplace Items" value={items.length || '—'} sub="Available now"
          color="bg-emerald-500/15 border border-emerald-500/20" />
        <StatCard to="/clubs" icon={<Users className="w-5 h-5 text-purple-300" />}
          label="Active Clubs" value={loading ? '—' : clubs.length} sub="Join one today"
          color="bg-purple-500/15 border border-purple-500/20" />
        <StatCard to="/lost-found" icon={<Search className="w-5 h-5 text-orange-300" />}
          label="Lost & Found" value="Reports" sub="Help your peers"
          color="bg-orange-500/15 border border-orange-500/20" />
        <StatCard to="/feedback" icon={<MessageSquare className="w-5 h-5 text-pink-300" />}
          label="Send Feedback" value="Departments" sub="Your voice matters"
          color="bg-pink-500/15 border border-pink-500/20" />
        <div className="card p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gold-500/15 border border-gold-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-gold-300" />
          </div>
          <div>
            <p className="text-navy-400 text-xs font-medium">Your Role</p>
            <p className="font-display text-lg font-semibold text-white mt-0.5 capitalize">{user?.role}</p>
            {user?.yearOfStudy && <p className="text-navy-500 text-xs mt-0.5">Year {user.yearOfStudy}</p>}
          </div>
        </div>
      </div>

      {/* Two-column: events + marketplace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming events */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-white">Upcoming Events</h3>
            <Link to="/events" className="text-gold-400 text-xs hover:text-gold-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-navy-700/40 rounded-xl animate-pulse" />)}</div>
          ) : events.length === 0 ? (
            <p className="text-navy-500 text-sm text-center py-6">No upcoming events</p>
          ) : (
            <div className="space-y-1">{events.map(e => <QuickEventCard key={e._id} event={e} />)}</div>
          )}
        </div>

        {/* Recent listings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-white">Marketplace</h3>
            <Link to="/marketplace" className="text-gold-400 text-xs hover:text-gold-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-navy-700/40 rounded-xl animate-pulse" />)}</div>
          ) : items.length === 0 ? (
            <p className="text-navy-500 text-sm text-center py-6">No listings yet</p>
          ) : (
            <div className="space-y-1">{items.map(i => <QuickItemCard key={i._id} item={i} />)}</div>
          )}
        </div>
      </div>
    </div>
  )
}
