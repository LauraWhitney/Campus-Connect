import { useEffect, useState } from 'react'
import { Users, Calendar, ShoppingBag, UserCheck, Search, MessageSquare, Clock, ArrowRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { statsAPI } from '../../api/admin'
import type { DashboardStats } from '../../types'

// Single red brand style for every stat card — muted, not bright — same as student DashboardPage
const CARD_STYLE = { bg: 'linear-gradient(135deg, #4d0013 0%, #800022 100%)', shadow: '0 6px 20px rgba(77,0,19,0.3)' }

const CHART_COLORS = ['#c81e45', '#d4af37', '#a0002a', '#e9ba3f', '#800022', '#b8912a']

const TOOLTIP_STYLE = {
  backgroundColor: '#1a0007',
  border: '1px solid rgba(200,30,69,0.3)',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '12px',
}

interface GradientStatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
}

function GradientStatCard({ icon, label, value }: GradientStatCardProps) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4 transition-all duration-300 hover:scale-[1.02]"
      style={{ background: CARD_STYLE.bg, boxShadow: CARD_STYLE.shadow }}>
      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white/70 text-xs font-medium">{label}</p>
        <p className="font-display text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 flex items-start gap-4 animate-pulse bg-white/5" style={{ height: 96 }} />
      ))}
    </div>
  )
}

const ROLE_BADGE: Record<string, string> = {
  admin:    'badge-brand',
  lecturer: 'badge-yellow',
  student:  'badge-surface',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsAPI.get().then(setStats).finally(() => setLoading(false))
  }, [])

  const overviewData = stats ? [
    { name: 'Users',      value: stats.total_users },
    { name: 'Events',     value: stats.total_events },
    { name: 'Listings',   value: stats.total_marketplace_items },
    { name: 'Clubs',      value: stats.total_clubs },
    { name: 'Lost/Found', value: stats.total_lost_found },
    { name: 'Feedback',   value: stats.total_feedback },
  ] : []

  const feedbackPie = stats ? [
    { name: 'Pending',  value: stats.pending_feedback },
    { name: 'Resolved', value: Math.max(0, stats.total_feedback - stats.pending_feedback) },
  ] : []

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">

      {/* ── Hero header — same indigo→purple gradient as student greeting card ── */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #a0002a 0%, #c81e45 55%, #d4af37 100%)',
          boxShadow: '0 12px 40px rgba(200,30,69,0.4)',
        }}>
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Platform Overview</h2>
            <p className="text-white/60 text-sm mt-1">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 border border-white/20">
            <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-white text-xs font-medium">System Online</span>
          </div>
        </div>
      </div>

      {/* ── Gradient stat cards — same palette as student ── */}
      {loading ? <StatsSkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <GradientStatCard icon={<Users className="w-5 h-5 text-white" />}       label="Total Users"       value={stats!.total_users} />
          <GradientStatCard icon={<Calendar className="w-5 h-5 text-white" />}    label="Total Events"      value={stats!.total_events} />
          <GradientStatCard icon={<ShoppingBag className="w-5 h-5 text-white" />} label="Marketplace"       value={stats!.total_marketplace_items} />
          <GradientStatCard icon={<UserCheck className="w-5 h-5 text-white" />}   label="Active Clubs"      value={stats!.total_clubs} />
          <GradientStatCard icon={<Search className="w-5 h-5 text-white" />}      label="Lost & Found"      value={stats!.total_lost_found} />
          <GradientStatCard icon={<MessageSquare className="w-5 h-5 text-white" />} label="Total Feedback"  value={stats!.total_feedback} />
          <GradientStatCard icon={<Clock className="w-5 h-5 text-white" />}       label="Pending Feedback"  value={stats!.pending_feedback} />
        </div>
      )}

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-white mb-5">Platform Activity</h3>
          {loading ? <div className="h-52 bg-white/5 rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={overviewData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(200,30,69,0.06)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {overviewData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-display text-base font-semibold text-white mb-5">Feedback Status</h3>
          {loading ? <div className="h-52 bg-white/5 rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={feedbackPie} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  <Cell fill="#c81e45" />
                  <Cell fill="#d4af37" />
                </Pie>
                <Legend formatter={(v) => <span style={{ color: '#cbd5e1', fontSize: 12 }}>{v}</span>} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent users ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-indigo-900/60 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">Recently Registered Users</h3>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/10 rounded w-1/3" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
                <div className="h-5 w-16 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-indigo-900/60">
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th hidden sm:table-cell">Faculty</th>
                <th className="th hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent_users ?? []).map(u => (
                <tr key={u.id} className="table-row">
                  <td className="td font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg,#c81e45,#d4af37)' }}>
                        <span className="text-white text-[10px] font-bold">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="td">{u.email}</td>
                  <td className="td"><span className={ROLE_BADGE[u.role] ?? ROLE_BADGE.student}>{u.role}</span></td>
                  <td className="td hidden sm:table-cell">{u.faculty ?? '—'}</td>
                  <td className="td text-slate-400 hidden md:table-cell">
                    {new Date(u.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}