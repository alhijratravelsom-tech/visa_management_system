import { where, type QueryConstraint } from 'firebase/firestore'
import { createDoc, updateDocById, softDeleteDoc, getDocById, listDocs, currentUserId } from './base'
import type { Application, ApplicationStatus } from './types'

const COL = 'applications'

function generateApplicationNumber(): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 90000) + 10000
  return `KEN/${year}/${month}/${rand}`
}

export async function createApplication(
  data: Omit<Application, 'id' | 'applicationNumber' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>
) {
  const applicationNumber = generateApplicationNumber()
  return createDoc<Application>(COL, { ...data, applicationNumber })
}

export async function updateApplication(id: string, data: Partial<Application>) {
  return updateDocById(COL, id, data)
}

export async function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  reason?: string,
  currentStatus?: ApplicationStatus
) {
  const historyEntry = {
    oldStatus: currentStatus ?? 'draft',
    newStatus,
    reason,
    changedAt: new Date(),
    changedBy: currentUserId(),
  }
  await updateDocById(COL, id, {
    status: newStatus,
    [`statusHistory`]: historyEntry, // simplified - use arrayUnion in production
  })
}

export async function deleteApplication(id: string) {
  return softDeleteDoc(COL, id)
}

export async function getApplication(id: string) {
  return getDocById<Application>(COL, id)
}

export async function listApplications(filters?: {
  status?: ApplicationStatus
  officeId?: string
  customerId?: string
}): Promise<Application[]> {
  const constraints: QueryConstraint[] = []
  if (filters?.status) constraints.push(where('status', '==', filters.status))
  if (filters?.officeId) constraints.push(where('officeId', '==', filters.officeId))
  if (filters?.customerId) constraints.push(where('customerId', '==', filters.customerId))
  return listDocs<Application>(COL, constraints, 500, { field: 'createdAt', dir: 'desc' })
}

export async function getApplicationStats() {
  const all = await listDocs<Application>(COL, [], 1000)
  const stats = {
    total: all.length,
    pending: 0,
    processing: 0,
    approved: 0,
    rejected: 0,
    submitted: 0,
    draft: 0,
    cancelled: 0,
  }
  for (const app of all) {
    if (app.status in stats) (stats as Record<string, number>)[app.status]++
  }
  return stats
}
