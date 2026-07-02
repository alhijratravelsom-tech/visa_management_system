import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { getApplicationStats, listApplications } from '@/services/applications'
import { getFinancialSummary } from '@/services/payments'
import { StatusChip } from '@/components/ui/StatusChip'
import { PageLoader } from '@/components/ui/Spinner'
import { format } from 'date-fns'
import type { Application } from '@/services/types'

const MONTHLY_DATA = [
  { month: 'Jan', applications: 42, approved: 35 },
  { month: 'Feb', applications: 58, approved: 48 },
  { month: 'Mar', applications: 71, approved: 60 },
  { month: 'Apr', applications: 65, approved: 54 },
  { month: 'May', applications: 89, approved: 76 },
  { month: 'Jun', applications: 94, approved: 82 },
]

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: string
}

function StatCard({ icon, label, value, sub, color = 'bg-secondary-container' }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`${color} rounded-lg w-11 h-11 flex items-center justify-center flex-shrink-0`}>
        <span className="material-symbols-outlined text-on-secondary-container"
          style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</p>
        <p className="font-display text-headline-md text-on-surface mt-0.5">{value}</p>
        {sub && <p className="text-body-sm text-on-surface-variant mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [recentApps, setRecentApps] = useState<Application[]>([])
  const [financial, setFinancial] = useState({ totalRevenue: 0, netRevenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getApplicationStats(),
      listApplications(),
      getFinancialSummary(),
    ]).then(([s, apps, fin]) => {
      setStats(s)
      setRecentApps(apps.slice(0, 5))
      setFinancial(fin)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md text-on-surface">
            Welcome back, {profile?.displayName?.split(' ')[0]}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}  Overview of visa operations
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => navigate('/applications/new')}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Application
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="description" label="Total Applications" value={stats.total ?? 0} color="bg-secondary-container" />
        <StatCard icon="pending_actions" label="Pending" value={stats.pending ?? 0} color="bg-amber-100" />
        <StatCard icon="check_circle" label="Approved" value={stats.approved ?? 0} color="bg-emerald-100" />
        <StatCard
          icon="payments"
          label="Net Revenue"
          value={`$${financial.netRevenue.toLocaleString()}`}
          color="bg-purple-100"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Applications trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-title-sm text-on-surface">Application Trends</h2>
            <span className="text-body-sm text-on-surface-variant">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0051d5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0051d5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a16f" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00a16f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#c4c6ce" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#44474d' }} />
              <YAxis tick={{ fontSize: 11, fill: '#44474d' }} />
              <Tooltip />
              <Area type="monotone" dataKey="applications" stroke="#0051d5" fill="url(#colorApps)" strokeWidth={2} name="Total" />
              <Area type="monotone" dataKey="approved" stroke="#00a16f" fill="url(#colorApproved)" strokeWidth={2} name="Approved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="card p-5">
          <h2 className="font-display text-title-sm text-on-surface mb-4">Status Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Approved', key: 'approved', color: 'bg-emerald-500' },
              { label: 'Processing', key: 'processing', color: 'bg-blue-500' },
              { label: 'Pending', key: 'pending', color: 'bg-amber-500' },
              { label: 'Rejected', key: 'rejected', color: 'bg-red-500' },
              { label: 'Draft', key: 'draft', color: 'bg-slate-400' },
            ].map(({ label, key, color }) => {
              const count = (stats[key] ?? 0) as number
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-body-sm mb-1">
                    <span className="text-on-surface-variant">{label}</span>
                    <span className="font-semibold text-on-surface">{count}</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full">
                    <div className={`h-1.5 ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant">
            <p className="text-body-sm text-on-surface-variant">Approval Rate</p>
            <p className="font-display text-title-sm text-emerald-600">{approvalRate}%</p>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="font-display text-title-sm text-on-surface">Recent Applications</h2>
          <button
            className="text-body-sm text-secondary hover:underline"
            onClick={() => navigate('/applications')}
          >
            View all 
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                {['App. No.', 'Customer', 'Visa Type', 'Status', 'Financial', 'Date'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-label-caps text-on-surface-variant uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-body-md text-on-surface-variant">
                    No applications yet
                  </td>
                </tr>
              ) : (
                recentApps.map((app, i) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className={`border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-surface-container-lowest/40' : ''}`}
                  >
                    <td className="px-6 py-3 font-mono text-code-data text-secondary">{app.applicationNumber}</td>
                    <td className="px-6 py-3 text-body-md text-on-surface">{app.customerName ?? '--'}</td>
                    <td className="px-6 py-3 text-body-md text-on-surface-variant">{app.visaTypeName ?? '--'}</td>
                    <td className="px-6 py-3"><StatusChip status={app.status} /></td>
                    <td className="px-6 py-3"><StatusChip status={app.financialStatus} /></td>
                    <td className="px-6 py-3 text-body-sm text-on-surface-variant">
                      {format(app.createdAt, 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
