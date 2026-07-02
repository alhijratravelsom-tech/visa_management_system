import { useEffect, useState, useCallback } from 'react'
import { listOffices, createOffice, deleteOffice, creditWallet } from '@/services/offices'
import { StatusChip } from '@/components/ui/StatusChip'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageLoader } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Office } from '@/services/types'
import toast from 'react-hot-toast'

const INIT_FORM = {
  officeName: '', contactPerson: '', phone: '', email: '', address: '', country: '',
  status: 'active' as 'active' | 'suspended',
  wallet: { balance: 0, creditLimit: 0, outstanding: 0 },
}

export default function Offices() {
  const [offices, setOffices] = useState<Office[]>([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [walletModal, setWalletModal] = useState<Office | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Office | null>(null)
  const [form, setForm] = useState({ ...INIT_FORM })
  const [walletAmount, setWalletAmount] = useState('')
  const [walletDesc, setWalletDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setOffices(await listOffices()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.officeName) { toast.error('Office name is required'); return }
    setSaving(true)
    try {
      await createOffice(form)
      toast.success('Office created')
      setAddModal(false)
      setForm({ ...INIT_FORM })
      load()
    } catch { toast.error('Failed to create office') }
    finally { setSaving(false) }
  }

  const handleCredit = async () => {
    if (!walletModal || !walletAmount) return
    setSaving(true)
    try {
      await creditWallet(walletModal.id, parseFloat(walletAmount), walletDesc || 'Manual top-up', walletModal)
      toast.success('Wallet credited')
      setWalletModal(null)
      setWalletAmount('')
      setWalletDesc('')
      load()
    } catch { toast.error('Failed to credit wallet') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteOffice(deleteTarget.id)
      toast.success('Office deleted')
      setDeleteTarget(null)
      load()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md text-on-surface">Offices & Agents</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">{offices.length} registered offices</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setAddModal(true)}>
          <span className="material-symbols-outlined text-[18px]">add_business</span>Add Office
        </button>
      </div>

      {loading ? <PageLoader /> : offices.length === 0 ? (
        <div className="card p-12">
          <EmptyState icon="domain" title="No offices yet" description="Add your first office or agent to start managing applications." action={
            <button className="btn-primary mt-2" onClick={() => setAddModal(true)}>Add Office</button>
          } />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {offices.map((office) => (
            <div key={office.id} className="card p-5 hover:border-secondary transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
                  </div>
                  <div>
                    <h3 className="font-display text-title-sm text-on-surface">{office.officeName}</h3>
                    <p className="text-body-sm text-on-surface-variant">{office.contactPerson}</p>
                  </div>
                </div>
                <StatusChip status={office.status} size="sm" />
              </div>

              <div className="space-y-1.5 text-body-sm text-on-surface-variant mb-4">
                {office.phone && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">phone</span>{office.phone}</div>}
                {office.email && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">email</span>{office.email}</div>}
                {office.country && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">location_on</span>{office.country}</div>}
              </div>

              {/* Wallet */}
              <div className="bg-surface-container-low rounded-lg p-3 mb-4">
                <p className="text-label-caps text-on-surface-variant uppercase tracking-wider text-[10px] font-semibold mb-2">Wallet</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[11px] text-on-surface-variant">Balance</p>
                    <p className="font-semibold text-body-sm text-emerald-600">${office.wallet.balance.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-on-surface-variant">Credit Limit</p>
                    <p className="font-semibold text-body-sm text-on-surface">${office.wallet.creditLimit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-on-surface-variant">Outstanding</p>
                    <p className="font-semibold text-body-sm text-amber-600">${office.wallet.outstanding.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-body-sm py-1.5" onClick={() => setWalletModal(office)}>
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">account_balance_wallet</span>Top Up
                </button>
                <button className="btn-ghost px-3 py-1.5" onClick={() => setDeleteTarget(office)}>
                  <span className="material-symbols-outlined text-[16px] text-error">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Office Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Office" size="lg">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Office Name *', key: 'officeName', type: 'text' },
            { label: 'Contact Person', key: 'contactPerson', type: 'text' },
            { label: 'Phone', key: 'phone', type: 'tel' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Address', key: 'address', type: 'text' },
            { label: 'Country', key: 'country', type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">{label}</label>
              <input
                type={type}
                value={(form as unknown as Record<string, string>)[key] ?? ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input-field"
              />
            </div>
          ))}
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Credit Limit (USD)</label>
            <input type="number" min="0" className="input-field"
              value={form.wallet.creditLimit}
              onChange={(e) => setForm({ ...form, wallet: { ...form.wallet, creditLimit: parseFloat(e.target.value) || 0 } })}
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button className="btn-ghost" onClick={() => setAddModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating' : 'Create Office'}</button>
        </div>
      </Modal>

      {/* Wallet Top-up Modal */}
      <Modal open={!!walletModal} onClose={() => setWalletModal(null)} title={`Top Up -- ${walletModal?.officeName}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Amount (USD)</label>
            <input type="number" min="0" step="0.01" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} className="input-field" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Description</label>
            <input type="text" value={walletDesc} onChange={(e) => setWalletDesc(e.target.value)} className="input-field" placeholder="e.g. Monthly top-up" />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-ghost" onClick={() => setWalletModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleCredit} disabled={saving}>{saving ? 'Processing' : 'Credit Wallet'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Office" message={`Delete "${deleteTarget?.officeName}"? This cannot be undone.`}
        confirmLabel="Delete" danger loading={deleting} />
    </div>
  )
}
