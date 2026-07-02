import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { getApplicationStats } from '@/services/applications'
import { PageLoader } from '@/components/ui/Spinner'

const COLORS = ['#0051d5', '#00a16f', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

const MONTHLY = [
  { month: 'Jan', submitted: 42, approved: 35, rejected: 5 },
  { month: 'Feb', submitted: 58, approved: 48, rejected: 8 },
  { month: 'Mar', submitted: 71, approved: 60, rejected: 9 },
  { month: 'Apr', submitted: 65, approved: 54, rejected: 7 },
  { month: 'May', submitted: 89, approved: 76, rejected: 10 },
  { month: 'Jun', submitted: 94, approved: 82, rejected: 8 },
]

export default function Reports() {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getApplicationStats().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const pieData = [
    { name: 'Approved', value: stats.approved ?? 0 },
    { name: 'Processing', value: stats.processing ?? 0 },
    { name: 'Pending', value: stats.pending ?? 0 },
    { name: 'Rejected', value: stats.rejected ?? 0 },
    { name: 'Draft', value: stats.draft ?? 0 },
    { name: 'Cancelled', value: stats.cancelled ?? 0 },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md text-on-surface">Reports & Analytics</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">Application performance and operational metrics</p>
        </div>
        <div className="flex gap-3">
          <select className="input-field w-36">
            <option>Last 6 months</option>
            <option>Last 12 months</option>
            <option>This year</option>
          </select>
          <button className="btn-ghost flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">download</span>Export
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total ?? 0, color: 'text-on-surface' },
          { label: 'Approved', value: stats.approved ?? 0, color: 'text-emerald-600' },
          { label: 'Processing', value: stats.processing ?? 0, color: 'text-blue-600' },
          { label: 'Pending', value: stats.pending ?? 0, color: 'text-amber-600' },
          { label: 'Rejected', value: stats.rejected ?? 0, color: 'text-red-600' },
          { label: 'Cancelled', value: stats.cancelled ?? 0, color: 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</p>
            <p className={`font-display text-headline-md mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h2 className="font-display text-title-sm text-on-surface mb-4">Monthly Application Volume</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#c4c6ce" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#44474d' }} />
              <YAxis tick={{ fontSize: 11, fill: '#44474d' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="submitted" fill="#0051d5" name="Submitted" radius={[2, 2, 0, 0]} />
              <Bar dataKey="approved" fill="#00a16f" name="Approved" radius={[2, 2, 0, 0]} />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-title-sm text-on-surface mb-4">Status Distribution</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-on-surface-variant text-body-md">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Export options */}
      <div className="card p-5">
        <h2 className="font-display text-title-sm text-on-surface mb-3">Export Reports</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'All Applications (CSV)', icon: 'table_chart' },
            { label: 'Financial Summary (PDF)', icon: 'picture_as_pdf' },
            { label: 'Office Performance (XLSX)', icon: 'grid_on' },
            { label: 'Audit Log (CSV)', icon: 'security' },
          ].map(({ label, icon }) => (
            <button key={label} className="btn-ghost flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
