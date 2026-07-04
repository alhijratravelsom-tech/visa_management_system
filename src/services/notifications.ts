import { where } from 'firebase/firestore'
import { createDoc, updateDocById, listDocs, currentUserId } from './base'
import type { Notification } from './types'

const COL = 'notifications'

export async function createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>) {
  return createDoc<Notification>(COL, data)
}

export async function listNotifications(userId?: string): Promise<Notification[]> {
  const uid = userId ?? currentUserId()
  return listDocs<Notification>(COL, [
    where('userId', '==', uid),
  ], 100, { field: 'createdAt', dir: 'desc' })
}

export async function markAsRead(id: string) {
  return updateDocById(COL, id, { readStatus: true })
}

export async function markAllAsRead(userId?: string) {
  const uid = userId ?? currentUserId()
  const notifications = await listNotifications(uid)
  await Promise.all(
    notifications.filter((n) => !n.readStatus).map((n) => markAsRead(n.id))
  )
}
