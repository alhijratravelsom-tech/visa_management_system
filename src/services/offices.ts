import { where } from 'firebase/firestore'
import { createDoc, updateDocById, softDeleteDoc, getDocById, listDocs } from './base'
import type { Office, WalletTransaction } from './types'

const COL = 'offices'
const WALLET_COL = 'officeWalletTransactions'

export async function createOffice(data: Omit<Office, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>) {
  return createDoc<Office>(COL, data)
}

export async function updateOffice(id: string, data: Partial<Office>) {
  return updateDocById(COL, id, data)
}

export async function deleteOffice(id: string) {
  return softDeleteDoc(COL, id)
}

export async function getOffice(id: string) {
  return getDocById<Office>(COL, id)
}

export async function listOffices(): Promise<Office[]> {
  return listDocs<Office>(COL, [], 100, { field: 'officeName', dir: 'asc' })
}

export async function creditWallet(officeId: string, amount: number, description: string, office: Office) {
  const newBalance = office.wallet.balance + amount
  await updateDocById(COL, officeId, {
    'wallet.balance': newBalance,
    'wallet.outstanding': Math.max(0, office.wallet.outstanding - amount),
  })
  await createDoc<WalletTransaction>(WALLET_COL, {
    officeId,
    type: 'credit',
    amount,
    balanceAfter: newBalance,
    description,
  } as Omit<WalletTransaction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>)
}

export async function debitWallet(officeId: string, amount: number, description: string, relatedId: string, office: Office) {
  const newBalance = office.wallet.balance - amount
  await updateDocById(COL, officeId, {
    'wallet.balance': newBalance,
    'wallet.outstanding': office.wallet.outstanding + amount,
  })
  await createDoc<WalletTransaction>(WALLET_COL, {
    officeId,
    type: 'debit',
    amount,
    balanceAfter: newBalance,
    relatedId,
    description,
  } as Omit<WalletTransaction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived' | 'isDeleted'>)
}

export async function listWalletTransactions(officeId: string): Promise<WalletTransaction[]> {
  return listDocs<WalletTransaction>(WALLET_COL, [
    where('officeId', '==', officeId),
  ], 100, { field: 'createdAt', dir: 'desc' })
}
