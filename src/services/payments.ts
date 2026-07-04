import { where, type QueryConstraint } from 'firebase/firestore'
import { createDoc, updateDocById, listDocs } from './base'
import type { Payment } from './types'

const COL = 'payments'

export async function createPayment(data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>) {
  return createDoc<Payment>(COL, data)
}

export async function listPayments(applicationId?: string): Promise<Payment[]> {
  const constraints: QueryConstraint[] = []
  if (applicationId) constraints.push(where('applicationId', '==', applicationId))
  return listDocs<Payment>(COL, constraints, 500, { field: 'createdAt', dir: 'desc' })
}

export async function getFinancialSummary() {
  const payments = await listDocs<Payment>(COL, [], 2000)
  const totalRevenue = payments
    .filter((p) => p.type === 'payment')
    .reduce((sum, p) => sum + p.amount, 0)
  const totalRefunded = payments
    .filter((p) => p.type === 'refund')
    .reduce((sum, p) => sum + p.amount, 0)
  return {
    totalRevenue,
    totalRefunded,
    netRevenue: totalRevenue - totalRefunded,
    transactionCount: payments.length,
  }
}
