import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { auth } from '@/firebase/config'

export function currentUserId() {
  return auth.currentUser?.uid ?? 'system'
}

export function currentUserEmail() {
  return auth.currentUser?.email ?? 'system'
}

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate()
  if (val instanceof Date) return val
  return new Date()
}

export function fromFirestore<T>(id: string, data: DocumentData): T {
  return {
    ...data,
    id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as T
}

export function baseFields() {
  return {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: currentUserId(),
    updatedBy: currentUserId(),
    isArchived: false,
    isDeleted: false,
  }
}

export function updateFields() {
  return {
    updatedAt: serverTimestamp(),
    updatedBy: currentUserId(),
  }
}

// Generic CRUD helpers
export async function createDoc<T>(collectionName: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>) {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    ...baseFields(),
  })
  return ref.id
}

export async function updateDocById(collectionName: string, id: string, data: Partial<DocumentData>) {
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    ...updateFields(),
  })
}

export async function softDeleteDoc(collectionName: string, id: string) {
  await updateDoc(doc(db, collectionName, id), {
    isDeleted: true,
    ...updateFields(),
  })
}

export async function getDocById<T>(collectionName: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, id))
  if (!snap.exists()) return null
  return fromFirestore<T>(snap.id, snap.data())
}

export interface SortSpec {
  field: string
  dir?: 'asc' | 'desc'
}

// NOTE: sorting is done client-side (not via Firestore orderBy) because
// combining where('isDeleted') with orderBy requires a composite index
// per collection/field. Lists are capped by maxLimit, so this is safe.
export async function listDocs<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  maxLimit = 100,
  sort?: SortSpec
): Promise<T[]> {
  const q = query(
    collection(db, collectionName),
    where('isDeleted', '==', false),
    ...constraints,
    limit(maxLimit)
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => fromFirestore<T>(d.id, d.data()))
  if (sort) {
    const dir = sort.dir === 'desc' ? -1 : 1
    docs.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sort.field]
      const bv = (b as Record<string, unknown>)[sort.field]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return -dir
      if (av > bv) return dir
      return 0
    })
  }
  return docs
}

export { orderBy, where, limit }
