import { orderBy } from 'firebase/firestore'
import { createDoc, listDocs, currentUserId, currentUserEmail } from './base'
import type { AuditLog } from './types'

const COL = 'auditLogs'

export async function logAudit(
  action: string,
  module: string,
  recordId: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>,
  reason?: string
) {
  return createDoc<AuditLog>(COL, {
    action,
    module,
    recordId,
    oldValue,
    newValue,
    reason,
    userEmail: currentUserEmail(),
  } as Omit<AuditLog, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>)
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  return listDocs<AuditLog>(COL, [orderBy('createdAt', 'desc')], 500)
}
