import { where, orderBy } from 'firebase/firestore'
import { createDoc, updateDocById, softDeleteDoc, getDocById, listDocs } from './base'
import type { Customer } from './types'

const COL = 'customers'

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>) {
  return createDoc<Customer>(COL, data)
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  return updateDocById(COL, id, data)
}

export async function deleteCustomer(id: string) {
  return softDeleteDoc(COL, id)
}

export async function getCustomer(id: string) {
  return getDocById<Customer>(COL, id)
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  // Firestore doesn't support full text search; load all and filter client-side for now
  const customers = await listDocs<Customer>(COL, [orderBy('fullName', 'asc')], 500)
  if (!search) return customers
  const lower = search.toLowerCase()
  return customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(lower) ||
      c.passportNumber.toLowerCase().includes(lower) ||
      c.email?.toLowerCase().includes(lower) ||
      c.phone?.includes(search)
  )
}

export async function findByPassport(passportNumber: string): Promise<Customer | null> {
  const results = await listDocs<Customer>(COL, [where('passportNumber', '==', passportNumber)], 1)
  return results[0] ?? null
}
