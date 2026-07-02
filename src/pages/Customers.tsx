import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { listCustomers, deleteCustomer } from '@/services/customers'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageLoader } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { createCustomer } from '@/services/customers'
import type { Customer } from '@/services/types'
import toast from 'react-hot-toast'

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState({ fullName: '', passportNumber: '', nationality: '', dob: '', gender: 'male', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCustomers(await listCustomers(search || undefined))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCustomer(deleteTarget.id)
      toast.success('Customer deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to delete customer')
    } finally {
      setDeleting(false)
    }
  }

  const handleAdd = async () => {
    if (!form.fullName || !form.passportNumber) {
      toast.error('Name and passport number are required')
      return
    }
    setSaving(true)
    try {
      await createCustomer({ ...form, gender: form.gender as 'male' | 'female' })
      toast.success('Customer created')
      setAddModal(false)
      setForm({ fullName: '', passportNumber: '', nationality: '', dob: '', gender: 'male', phone: '', email: '' })
      load()
    } catch {
      toast.error('Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md text-on-surface">Customers</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">{customers.length} registered customers</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setAddModal(true)}>
          <span className="material-symbols-outlined text-[18px]">person_add</span>Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, passport number or email"
            className="input-field pl-9"
          />
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                {['Name', 'Passport No.', 'Nationality', 'Date of Birth', 'Phone', 'Email', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-label-caps text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} className="py-12 px-5">
                  <EmptyState icon="group" title="No customers found" description="Add your first customer or adjust your search." action={
                    <button className="btn-primary mt-2" onClick={() => setAddModal(true)}>Add Customer</button>
                  } />
                </td></tr>
              ) : customers.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-outline-variant hover:bg-surface-container-low cursor-pointer ${i % 2 === 1 ? 'bg-surface-container-lowest/30' : ''}`}
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-xs font-bold flex-shrink-0">
                        {c.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-body-md text-on-surface font-medium">{c.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-code-data text-secondary">{c.passportNumber}</td>
                  <td className="px-5 py-3 text-body-sm text-on-surface-variant">{c.nationality}</td>
                  <td className="px-5 py-3 text-body-sm text-on-surface-variant">{c.dob || '--'}</td>
                  <td className="px-5 py-3 text-body-sm text-on-surface-variant">{c.phone || '--'}</td>
                  <td className="px-5 py-3 text-body-sm text-on-surface-variant">{c.email || '--'}</td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/customers/${c.id}`)} className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors">
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors">
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Delete customer "${deleteTarget?.fullName}"? Their application history will be retained.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Customer" size="lg">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Full Name *', key: 'fullName', type: 'text', placeholder: 'As on passport' },
            { label: 'Passport Number *', key: 'passportNumber', type: 'text', placeholder: 'A12345678' },
            { label: 'Nationality', key: 'nationality', type: 'text', placeholder: 'e.g. SOM' },
            { label: 'Date of Birth', key: 'dob', type: 'date' },
            { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+252 61 000 0000' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'email@example.com' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">{label}</label>
              <input
                type={type}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input-field"
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Gender</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button className="btn-ghost" onClick={() => setAddModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Saving' : 'Create Customer'}</button>
        </div>
      </Modal>
    </div>
  )
}
