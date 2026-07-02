import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { listPayments, getFinancialSummary } from '@/services/payments'
import { PageLoader } from '@/components/ui/Spinner'
import type { Payment } from '@/services/types'

const MONTHLY_MOCK = [
  { month: 'Jan', revenue: 12400 },
  { month: 'Feb', revenue: 18200 },
  { month: 'Mar', revenue: 15800 },
  { month: 'Apr', revenue: 21000 },
  { month: 'May', revenue: 24500 },
  { month: 'Jun', revenue: 19800 },
]

export default function Financial() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState({ totalRevenue: 0, totalRefunded: 0, netRevenue: 0, transactionCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listPayments(), getFinancialSummary()])
      .then(([p, s]) => { setPayments(p); setSummary(s) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md text-on-surface">Financial Dashboard</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">Revenue, payments, and transaction history</p>
        </div>
        <button className="btn-ghost flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">download</span>Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${summary.totalRevenue.toLocaleString()}`, icon: 'trending_up', color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Total Refunded', value: `$${summary.totalRefunded.toLocaleString()}`, icon: 'undo', color: 'bg-red-100 text-red-600' },
          { label: 'Net Revenue', value: `$${summary.netRevenue.toLocaleString()}`, icon: 'payments', color: 'bg-blue-100 text-blue-600' },
          { label: 'Transactions', value: summary.transactionCount, icon: 'receipt_long', color: 'bg-purple-100 text-purple-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card p-5 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color.split(' ')[0]}`}>
              <span className={`material-symbols-outlined ${color.split(' ')[1]}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <div>
              <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</p>
              <p className="font-display text-headline-md text-on-surface mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-6">
        <h2 className="font-display text-title-sm text-on-surface mb-4">Monthly Revenue</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY_MOCK} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#c4c6ce" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#44474d' }} />
            <YAxis tick={{ fontSize: 11, fill: '#44474d' }} />
            <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#0051d5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-display text-title-sm text-on-surface">Recent Transactions</h2>
          <span className="text-body-sm text-on-surface-variant">{payments.length} records</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              {['Date', 'Application', 'Type', 'Method', 'Amount', 'Reference'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-label-caps text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-body-md text-on-surface-variant">No transactions recorded</td></tr>
            ) : payments.slice(0, 50).map((p) => (
              <tr key={p.id} className="border-b border-outline-variant hover:bg-surface-container-low">
                <td className="px-5 py-3 text-body-sm text-on-surface-variant">{format(p.date, 'dd MMM yyyy')}</td>
                <td className="px-5 py-3 font-mono text-[11px] text-secondary">{p.applicationId.slice(0, 12)}</td>
                <td className="px-5 py-3">
                  <span className={`chip ${p.type === 'refund' ? 'chip-rejected' : 'chip-approved'}`}>{p.type}</span>
                </td>
                <td className="px-5 py-3 text-body-sm text-on-surface-variant capitalize">{p.method.replace('_', ' ')}</td>
                <td className="px-5 py-3">
                  <span className={`font-semibold text-body-sm ${p.type === 'refund' ? 'text-error' : 'text-emerald-600'}`}>
                    {p.type === 'refund' ? '-' : '+'}${p.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-[11px] text-on-surface-variant">{p.reference || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
