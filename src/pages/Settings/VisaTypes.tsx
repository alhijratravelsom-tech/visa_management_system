import { useEffect, useState, useCallback } from 'react'
import { listVisaTypes, createVisaType, updateVisaType, deleteVisaType } from '@/services/visaTypes'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusChip } from '@/components/ui/StatusChip'
import { PageLoader, EmptyState } from '@/components/ui'
import type { VisaType } from '@/services/types'
import toast from 'react-hot-toast'

const INIT = {
  name: '', countryCode: '', countryName: '', costPrice: 0,
  defaultCustomerPrice: 0, defaultOfficePrice: 0, processingDays: 5, status: 'active' as const,
}

export default function VisaTypes() {
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<VisaType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VisaType | null>(null)
  const [form, setForm] = useState({ ...INIT })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setVisaTypes(await listVisaTypes()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openEdit = (vt: VisaType) => {
    setEditTarget(vt)
    setForm({
      name: vt.name, countryCode: vt.countryCode, countryName: vt.countryName,
      costPrice: vt.costPrice, defaultCustomerPrice: vt.defaultCustomerPrice,
      defaultOfficePrice: vt.defaultOfficePrice, processingDays: vt.processingDays,
      status: vt.status as 'active',
    })
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.name || !form.countryCode) { toast.error('Name and country code are required'); return }
    setSaving(true)
    try {
      if (modal === 'edit' && editTarget) {
        await updateVisaType(editTarget.id, form)
        toast.success('Visa type updated')
      } else {
        await createVisaType(form)
        toast.success('Visa type created')
      }
      setModal(null)
      load()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteVisaType(deleteTarget.id)
      toast.success('Visa type deleted')
      setDeleteTarget(null)
      load()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md text-on-surface">Visa Types & Pricing</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">{visaTypes.length} visa types configured</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setForm({ ...INIT }); setModal('add') }}>
          <span className="material-symbols-outlined text-[18px]">add</span>Add Visa Type
        </button>
      </div>

      {loading ? <PageLoader /> : visaTypes.length === 0 ? (
        <div className="card p-12"><EmptyState icon="card_travel" title="No visa types" description="Add your first visa type to start processing applications." /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                {['Visa Type', 'Country', 'Cost Price', 'Customer Price', 'Office Price', 'Processing', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-label-caps text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visaTypes.map((vt) => (
                <tr key={vt.id} className="border-b border-outline-variant hover:bg-surface-container-low">
                  <td className="px-5 py-3 font-medium text-on-surface text-body-md">{vt.name}</td>
                  <td className="px-5 py-3 font-mono text-code-data text-secondary">{vt.countryCode}</td>
                  <td className="px-5 py-3 text-body-sm">${vt.costPrice}</td>
                  <td className="px-5 py-3 text-body-sm">${vt.defaultCustomerPrice}</td>
                  <td className="px-5 py-3 text-body-sm">${vt.defaultOfficePrice}</td>
                  <td className="px-5 py-3 text-body-sm text-on-surface-variant">{vt.processingDays} days</td>
                  <td className="px-5 py-3"><StatusChip status={vt.status} size="sm" /></td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(vt)} className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(vt)} className="p-1.5 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Visa Type' : 'Add Visa Type'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Visa Type Name *', key: 'name', type: 'text' },
            { label: 'Country Code *', key: 'countryCode', type: 'text', placeholder: 'e.g. TUR' },
            { label: 'Country Name', key: 'countryName', type: 'text' },
            { label: 'Processing Days', key: 'processingDays', type: 'number' },
            { label: 'Cost Price (USD)', key: 'costPrice', type: 'number' },
            { label: 'Customer Price (USD)', key: 'defaultCustomerPrice', type: 'number' },
            { label: 'Office Price (USD)', key: 'defaultOfficePrice', type: 'number' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">{label}</label>
              <input
                type={type}
                value={(form as Record<string, string | number>)[key] as string}
                onChange={(e) => setForm({ ...form, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
                className="input-field"
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' })} className="input-field">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving' : 'Save'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Visa Type" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" danger loading={deleting} />
    </div>
  )
}
