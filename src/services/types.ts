export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export type FinancialStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export interface BaseDoc {
  id: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
  isArchived: boolean
  isDeleted: boolean
}

export interface Customer extends BaseDoc {
  fullName: string
  passportNumber: string
  nationality: string
  dob: string
  gender: 'male' | 'female'
  phone: string
  email: string
  photoURL?: string
  metadata?: Record<string, string> // OCR data
}

export interface Office extends BaseDoc {
  officeName: string
  contactPerson: string
  phone: string
  email: string
  address?: string
  country?: string
  wallet: {
    balance: number
    creditLimit: number
    outstanding: number
  }
  status: 'active' | 'suspended'
}

export interface VisaType extends BaseDoc {
  name: string
  countryCode: string
  countryName: string
  costPrice: number
  defaultCustomerPrice: number
  defaultOfficePrice: number
  processingDays: number
  status: 'active' | 'inactive'
}

export interface Application extends BaseDoc {
  applicationNumber: string
  customerId: string
  customerName?: string
  officeId?: string
  officeName?: string
  visaTypeId: string
  visaTypeName?: string
  countryCode?: string
  status: ApplicationStatus
  financialStatus: FinancialStatus
  passportImageURL?: string
  photoImageURL?: string
  visaFileURL?: string
  notes?: string
  statusHistory?: StatusHistoryEntry[]
}

export interface StatusHistoryEntry {
  oldStatus: ApplicationStatus
  newStatus: ApplicationStatus
  reason?: string
  changedAt: Date
  changedBy: string
}

export interface Payment extends BaseDoc {
  applicationId: string
  amount: number
  method: 'cash' | 'bank_transfer' | 'wallet' | 'card'
  reference?: string
  date: Date
  type: 'payment' | 'refund'
  notes?: string
}

export interface WalletTransaction extends BaseDoc {
  officeId: string
  type: 'credit' | 'debit' | 'adjustment'
  amount: number
  balanceAfter: number
  relatedId?: string
  description: string
}

export interface Notification extends BaseDoc {
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  readStatus: boolean
  relatedId?: string
  relatedModule?: string
}

export interface AuditLog extends BaseDoc {
  action: string
  module: string
  recordId: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  reason?: string
  ipAddress?: string
  userEmail?: string
}
