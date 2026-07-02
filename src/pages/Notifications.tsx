import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { listNotifications, markAsRead, markAllAsRead } from '@/services/notifications'
import { PageLoader } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Notification } from '@/services/types'

const TYPE_STYLE: Record<string, string> = {
  info: 'bg-blue-50 text-blue-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  error: 'bg-red-50 text-red-600',
}

const TYPE_ICON: Record<string, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { setNotifications(await listNotifications()) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleRead = async (n: Notification) => {
    if (n.readStatus) return
    await markAsRead(n.id)
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, readStatus: true } : x))
  }

  const handleMarkAll = async () => {
    await markAllAsRead()
    setNotifications((prev) => prev.map((x) => ({ ...x, readStatus: true })))
  }

  const unreadCount = notifications.filter((n) => !n.readStatus).length

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md text-on-surface">Notifications</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-ghost text-body-sm" onClick={handleMarkAll}>
            Mark all as read
          </button>
        )}
      </div>

      {loading ? <PageLoader /> : notifications.length === 0 ? (
        <div className="card p-12">
          <EmptyState icon="notifications" title="You're all caught up" description="No notifications at the moment." />
        </div>
      ) : (
        <div className="card divide-y divide-outline-variant">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleRead(n)}
              className={`flex items-start gap-4 p-5 cursor-pointer hover:bg-surface-container-low transition-colors ${!n.readStatus ? 'bg-secondary-fixed/10' : ''}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_STYLE[n.type] ?? TYPE_STYLE.info}`}>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {TYPE_ICON[n.type] ?? 'info'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-body-md ${!n.readStatus ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>{n.title}</p>
                  {!n.readStatus && <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />}
                </div>
                <p className="text-body-sm text-on-surface-variant mt-0.5">{n.message}</p>
                <p className="text-[11px] text-outline mt-1">{format(n.createdAt, 'dd MMM yyyy, HH:mm')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
