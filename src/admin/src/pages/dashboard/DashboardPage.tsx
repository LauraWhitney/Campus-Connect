import { useEffect, useState } from 'react'
import { Users, Calendar, ShoppingBag, UserCheck, Search, MessageSquare, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { statsAPI } from '../../api/admin'
import type { DashboardStats } from '../../types'
import { StatCard } from '../../components/ui/index'

const CHART_COLORS = ['#d4af37', '#1e3a6e', '#c9a84c', '#1a2f5a', '#f0c040', '#0d1f3c']

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: '#0d1f3c',
  border: '1px solid rgba(212,175,55,0.2)',
  borderRadius: '10px',
  color: '#fff',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '12px',
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="card p-5 flex items-start gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-navy-700" />
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-navy-700 rounded w-3/4" />
            <div className="h-6 bg-navy-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsAPI.get().then(setStats).finally(() => setLoading(false))
  }, [])

  const overviewData = stats ? [
    { name: 'Users',       value: stats.total_users },
    { name: 'Events',      value: stats.total_events },
    { name: 'Listings',    value: stats.total_marketplace_items },
    { name: 'Clubs',       value: stats.total_clubs },
    { name: 'Lost/Found',  value: stats.total_lost_found },
    { name: 'Feedback',    value: stats.total_feedback },
  ] : []

  const feedbackPie = stats ? [
    { name: 'Pending',  value: stats.pending_feedback },
    { name: 'Resolved', value: stats.total_feedback - stats.pending_feedback },
  ] : []

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-gold-500/8 blur-2xl pointer-events-none" />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Platform Overview</h2>
            <p className="text-navy-400 text-sm mt-1">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 text-xs font-medium">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {loading ? <StatsSkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <StatCard icon={<Users className="w-5 h-5 text-blue-300" />}   label="Total Users"       value={stats!.total_users}             color="bg-blue-500/15 border border-blue-500/20" />
          <StatCard icon={<Calendar className="w-5 h-5 text-purple-300" />} label="Total Events"    value={stats!.total_events}            color="bg-purple-500/15 border border-purple-500/20" />
          <StatCard icon={<ShoppingBag className="w-5 h-5 text-emerald-300" />} label="Marketplace" value={stats!.total_marketplace_items} color="bg-emerald-500/15 border border-emerald-500/20" />
          <StatCard icon={<UserCheck className="w-5 h-5 text-gold-300" />}  label="Active Clubs"   value={stats!.total_clubs}             color="bg-gold-500/15 border border-gold-500/20" />
          <StatCard icon={<Search className="w-5 h-5 text-orange-300" />}   label="Lost & Found"   value={stats!.total_lost_found}        color="bg-orange-500/15 border border-orange-500/20" />
          <StatCard icon={<MessageSquare className="w-5 h-5 text-pink-300" />} label="Total Feedback" value={stats!.total_feedback}        color="bg-pink-500/15 border border-pink-500/20" />
          <StatCard icon={<Clock className="w-5 h-5 text-yellow-300" />}    label="Pending Feedback" value={stats!.pending_feedback}       color="bg-yellow-500/15 border border-yellow-500/20" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-white mb-5">Platform Activity</h3>
          {loading ? <div className="h-52 bg-navy-700/30 rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={overviewData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#7490c2', fontSize: 11, fontFamily: '"DM Sans"' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7490c2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} cursor={{ fill: 'rgba(212,175,55,0.06)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {overviewData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="font-display text-base font-semibold text-white mb-5">Feedback Status</h3>
          {loading ? <div className="h-52 bg-navy-700/30 rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={feedbackPie} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {feedbackPie.map((_, i) => <Cell key={i} fill={i === 0 ? '#d4af37' : '#1e3a6e'} />)}
                </Pie>
                <Legend formatter={(v) => <span style={{ color: '#9db0d4', fontSize: 12 }}>{v}</span>} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent users table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-700/40">
          <h3 className="font-display text-base font-semibold text-white">Recently Registered Users</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-navy-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-navy-700 rounded w-1/3" />
                <div className="h-2.5 bg-navy-700/60 rounded w-1/2" />
              </div>
              <div className="h-5 w-16 bg-navy-700 rounded-full" />
            </div>
          ))}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700/40">
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
                      <div className="w-7 h-7 rounded-full bg-navy-700 border border-navy-600/40 flex items-center justify-center shrink-0">
                        <span className="text-gold-400 text-[10px] font-bold">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="td text-navy-400">{u.email}</td>
                  <td className="td">
                    <span className={u.role === 'admin' ? 'badge-gold' : u.role === 'lecturer' ? 'badge-blue' : 'badge-navy'}>
                      {u.role}
                    </span>
                  </td>
                  <td className="td text-navy-400 hidden sm:table-cell">{u.faculty ?? '—'}</td>
                  <td className="td text-navy-500 hidden md:table-cell">
                    {new Date(u.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
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
