import { orderBy } from 'firebase/firestore'
import { createDoc, updateDocById, softDeleteDoc, getDocById, listDocs } from './base'
import type { VisaType } from './types'

const COL = 'visaTypes'

export async function createVisaType(data: Omit<VisaType, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>) {
  return createDoc<VisaType>(COL, data)
}

export async function updateVisaType(id: string, data: Partial<VisaType>) {
  return updateDocById(COL, id, data)
}

export async function deleteVisaType(id: string) {
  return softDeleteDoc(COL, id)
}

export async function getVisaType(id: string) {
  return getDocById<VisaType>(COL, id)
}

export async function listVisaTypes(): Promise<VisaType[]> {
  return listDocs<VisaType>(COL, [orderBy('name', 'asc')])
}
