import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { listApplications, deleteApplication } from '@/services/applications'
import { StatusChip } from '@/components/ui/StatusChip'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageLoader, Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Application, ApplicationStatus } from '@/services/types'
import toast from 'react-hot-toast'

const ALL_STATUSES: ApplicationStatus[] = ['draft', 'submitted', 'processing', 'approved', 'rejected', 'cancelled']

type ViewMode = 'table' | 'kanban'

export default function Applications() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const results = await listApplications(statusFilter ? { status: statusFilter } : undefined)
      setApps(results)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const filtered = apps.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.applicationNumber.toLowerCase().includes(q) ||
      a.customerName?.toLowerCase().includes(q) ||
      a.visaTypeName?.toLowerCase().includes(q)
    )
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteApplication(deleteTarget.id)
      toast.success('Application deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  // Kanban groups
  const kanbanCols: ApplicationStatus[] = ['submitted', 'processing', 'approved', 'rejected']
  const byStatus = (status: ApplicationStatus) => filtered.filter((a) => a.status === status)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md text-on-surface">Applications</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">{apps.length} total records</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-surface-container border border-outline-variant rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-body-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-[16px] align-middle mr-1">table_rows</span>Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded text-body-sm font-medium transition-colors ${viewMode === 'kanban' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-[16px] align-middle mr-1">view_kanban</span>Kanban
            </button>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/applications/new')}>
            <span className="material-symbols-outlined text-[18px]">add</span>New Application
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, passport, or app number"
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
          className="input-field w-44"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button onClick={load} className="btn-ghost flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">refresh</span>Refresh
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : viewMode === 'table' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {['App. No.', 'Customer', 'Visa Type', 'Office', 'Status', 'Financial', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-label-caps text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <EmptyState icon="description" title="No applications found" description="Try adjusting your filters or create a new application." />
                    </td>
                  </tr>
                ) : (
                  filtered.map((app, i) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className={`border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-surface-container-lowest/30' : ''}`}
                    >
                      <td className="px-5 py-3 font-mono text-[12px] font-medium text-secondary">{app.applicationNumber}</td>
                      <td className="px-5 py-3 text-body-md text-on-surface font-medium">{app.customerName ?? '--'}</td>
                      <td className="px-5 py-3 text-body-sm text-on-surface-variant">{app.visaTypeName ?? '--'}</td>
                      <td className="px-5 py-3 text-body-sm text-on-surface-variant">{app.officeName ?? 'Direct'}</td>
                      <td className="px-5 py-3"><StatusChip status={app.status} /></td>
                      <td className="px-5 py-3"><StatusChip status={app.financialStatus} /></td>
                      <td className="px-5 py-3 text-body-sm text-on-surface-variant whitespace-nowrap">
                        {format(app.createdAt, 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/applications/${app.id}`)}
                            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors"
                            title="View"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>
                          <button
                            onClick={() => navigate(`/applications/${app.id}/edit`)}
                            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(app)}
                            className="p-1.5 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanCols.map((col) => {
            const colApps = byStatus(col)
            return (
              <div key={col} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-2 px-1">
                  <StatusChip status={col} />
                  <span className="text-body-sm text-on-surface-variant font-semibold">{colApps.length}</span>
                </div>
                <div className="space-y-2">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className="card p-4 cursor-pointer hover:border-secondary transition-colors"
                    >
                      <p className="font-mono text-[11px] font-medium text-secondary mb-1">{app.applicationNumber}</p>
                      <p className="text-body-md text-on-surface font-semibold">{app.customerName ?? '--'}</p>
                      <p className="text-body-sm text-on-surface-variant">{app.visaTypeName ?? '--'}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusChip status={app.financialStatus} size="sm" />
                        <span className="text-[11px] text-on-surface-variant">{format(app.createdAt, 'dd MMM')}</span>
                      </div>
                    </div>
                  ))}
                  {colApps.length === 0 && (
                    <div className="card p-4 text-center text-body-sm text-on-surface-variant">
                      No {col} applications
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Application"
        message={`Are you sure you want to delete application ${deleteTarget?.applicationNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}
