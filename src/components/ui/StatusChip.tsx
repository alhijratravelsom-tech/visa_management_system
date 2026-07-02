import type { ApplicationStatus, FinancialStatus } from '@/services/types'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  submitted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  // financial
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
  // office
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  inactive: 'bg-gray-50 text-gray-500 border-gray-200',
}

interface StatusChipProps {
  status: string
  size?: 'sm' | 'md'
}

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-500 border-gray-200'
  const sizeClass = size === 'sm' ? 'px-2 py-0 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClass} rounded-full font-semibold tracking-wider uppercase border ${style}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}
