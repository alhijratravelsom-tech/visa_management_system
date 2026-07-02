import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { listAuditLogs } from '@/services/auditLogs'
import { PageLoader } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import type { AuditLog } from '@/services/types'

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAuditLogs().then(setLogs).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-headline-md text-on-surface">Audit Log</h1>
        <p className="text-body-sm text-on-surface-variant mt-0.5">Complete record of all system actions</p>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                {['Timestamp', 'Action', 'Module', 'Record ID', 'User', 'Reason'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-label-caps text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="py-12 px-5">
                  <EmptyState icon="security" title="No audit records" description="System actions will appear here." />
                </td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-outline-variant hover:bg-surface-container-low">
                  <td className="px-5 py-3 text-body-sm text-on-surface-variant whitespace-nowrap">
                    {format(log.createdAt, 'dd MMM yyyy HH:mm')}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 bg-secondary-fixed text-secondary text-[11px] font-semibold rounded uppercase tracking-wider">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-body-sm text-on-surface capitalize">{log.module}</td>
                  <td className="px-5 py-3 font-mono text-[11px] text-on-surface-variant">{log.recordId.slice(0, 12)}</td>
                  <td className="px-5 py-3 text-body-sm text-on-surface-variant">{log.userEmail ?? '--'}</td>
                  <td className="px-5 py-3 text-body-sm text-on-surface-variant">{log.reason ?? '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
