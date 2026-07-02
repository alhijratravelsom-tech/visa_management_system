import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { getApplication, updateApplicationStatus } from '@/services/applications'
import { listPayments, createPayment } from '@/services/payments'
import { StatusChip } from '@/components/ui/StatusChip'
import { Modal } from '@/components/ui/Modal'
import { PageLoader } from '@/components/ui/Spinner'
import type { Application, Payment, ApplicationStatus } from '@/services/types'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['processing', 'rejected', 'cancelled'],
  processing: ['approved', 'rejected', 'cancelled'],
  approved: ['cancelled'],
  rejected: ['submitted'],
  cancelled: [],
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  useAuth() // ensure auth context is available
  const [app, setApp] = useState<Application | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentModal, setPaymentModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('processing')
  const [statusReason, setStatusReason] = useState('')
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', reference: '', type: 'payment' })

  useEffect(() => {
    if (!id) return
    Promise.all([getApplication(id), listPayments(id)]).then(([a, p]) => {
      setApp(a)
      setPayments(p)
    }).finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async () => {
    if (!app || !id) return
    try {
      await updateApplicationStatus(id, newStatus, statusReason, app.status)
      toast.success(`Status updated to ${newStatus}`)
      setStatusModal(false)
      const updated = await getApplication(id)
      setApp(updated)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleAddPayment = async () => {
    if (!id || !paymentForm.amount) return
    try {
      await createPayment({
        applicationId: id,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method as Payment['method'],
        reference: paymentForm.reference,
        date: new Date(),
        type: paymentForm.type as 'payment' | 'refund',
      })
      toast.success('Payment recorded')
      setPaymentModal(false)
      setPaymentForm({ amount: '', method: 'cash', reference: '', type: 'payment' })
      const updated = await listPayments(id)
      setPayments(updated)
    } catch {
      toast.error('Failed to record payment')
    }
  }

  if (loading) return <PageLoader />
  if (!app) return <div className="card p-8 text-center text-on-surface-variant">Application not found.</div>

  const totalPaid = payments.filter((p) => p.type === 'payment').reduce((s, p) => s + p.amount, 0)
  const transitions = STATUS_TRANSITIONS[app.status] ?? []

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/applications')} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-display text-title-sm text-on-surface">{app.applicationNumber}</h1>
            <p className="text-body-sm text-on-surface-variant">Application Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {transitions.length > 0 && (
            <button className="btn-secondary flex items-center gap-2" onClick={() => setStatusModal(true)}>
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              Update Status
            </button>
          )}
          <button className="btn-ghost flex items-center gap-2" onClick={() => navigate(`/applications/${id}/edit`)}>
            <span className="material-symbols-outlined text-[16px]">edit</span>Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Overview card */}
          <div className="card p-6">
            <h2 className="font-display text-title-sm text-on-surface mb-4 pb-3 border-b border-outline-variant">
              Application Overview
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'App. Number', value: app.applicationNumber, mono: true },
                { label: 'Customer', value: app.customerName ?? '--' },
                { label: 'Visa Type', value: app.visaTypeName ?? '--' },
                { label: 'Country', value: app.countryCode ?? '--' },
                { label: 'Office', value: app.officeName ?? 'Direct' },
                { label: 'Created', value: format(app.createdAt, 'dd MMM yyyy, HH:mm') },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</p>
                  <p className={`text-body-md text-on-surface mt-0.5 ${mono ? 'font-mono text-secondary text-code-data' : 'font-medium'}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-title-sm text-on-surface">Status</h2>
              <div className="flex gap-2">
                <StatusChip status={app.status} />
                <StatusChip status={app.financialStatus} />
              </div>
            </div>
            {app.notes && (
              <p className="text-body-md text-on-surface-variant bg-surface-container-low rounded-lg p-3 mt-2">
                {app.notes}
              </p>
            )}
          </div>

          {/* Documents */}
          <div className="card p-6">
            <h2 className="font-display text-title-sm text-on-surface mb-4">Documents</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Passport Scan', url: app.passportImageURL, icon: 'badge' },
                { label: 'Photo', url: app.photoImageURL, icon: 'portrait' },
                { label: 'Visa File', url: app.visaFileURL, icon: 'description' },
              ].map(({ label, url, icon }) => (
                <div key={label} className="border border-outline-variant rounded-lg p-4 text-center">
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="block">
                      <span className="material-symbols-outlined text-secondary text-3xl block mb-1"
                        style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      <p className="text-body-sm text-secondary hover:underline">{label}</p>
                    </a>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-outline text-3xl block mb-1">{icon}</span>
                      <p className="text-body-sm text-on-surface-variant">{label}</p>
                      <p className="text-[11px] text-outline mt-0.5">Not uploaded</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar: Payments */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-title-sm text-on-surface">Payments</h2>
              <button className="btn-secondary text-body-sm px-3 py-1" onClick={() => setPaymentModal(true)}>
                + Add
              </button>
            </div>
            <div className="mb-4 p-3 bg-surface-container-low rounded-lg">
              <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">Total Paid</p>
              <p className="font-display text-title-sm text-on-surface mt-0.5">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              {payments.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant text-center py-4">No payments recorded</p>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-start py-2 border-b border-outline-variant last:border-0">
                    <div>
                      <p className="text-body-sm text-on-surface font-medium capitalize">{p.type}</p>
                      <p className="text-[11px] text-on-surface-variant capitalize">{p.method.replace('_', ' ')}</p>
                      <p className="text-[11px] text-on-surface-variant">{format(p.date, 'dd MMM yyyy')}</p>
                    </div>
                    <p className={`text-body-sm font-semibold ${p.type === 'refund' ? 'text-error' : 'text-emerald-600'}`}>
                      {p.type === 'refund' ? '-' : '+'}${p.amount.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Application Status">
        <div className="space-y-4">
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
              className="input-field"
            >
              {transitions.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">
              Reason (Optional)
            </label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              rows={3}
              className="input-field resize-none"
              placeholder="Add a reason for this status change"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-ghost" onClick={() => setStatusModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleStatusUpdate}>Update Status</button>
          </div>
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment">
        <div className="space-y-4">
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Type</label>
            <select value={paymentForm.type} onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })} className="input-field">
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
            </select>
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="input-field"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Method</label>
            <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} className="input-field">
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="wallet">Office Wallet</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Reference (Optional)</label>
            <input
              type="text"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              className="input-field"
              placeholder="Transaction ID or receipt number"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-ghost" onClick={() => setPaymentModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleAddPayment}>Record Payment</button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
