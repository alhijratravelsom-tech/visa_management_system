import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCustomer, updateCustomer } from '@/services/customers'
import { listApplications } from '@/services/applications'
import { StatusChip } from '@/components/ui/StatusChip'
import { PageLoader } from '@/components/ui/Spinner'
import type { Customer, Application } from '@/services/types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Customer>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([getCustomer(id), listApplications({ customerId: id })]).then(([c, a]) => {
      setCustomer(c)
      setForm(c ?? {})
      setApps(a)
    }).finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      await updateCustomer(id, form)
      const updated = await getCustomer(id)
      setCustomer(updated)
      setEditing(false)
      toast.success('Customer updated')
    } catch {
      toast.error('Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (!customer) return <div className="card p-8 text-center text-on-surface-variant">Customer not found.</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customers')} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-display text-headline-md text-on-surface">{customer.fullName}</h1>
            <p className="text-body-sm text-on-surface-variant font-mono">{customer.passportNumber}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {editing ? (
            <>
              <button className="btn-ghost" onClick={() => { setEditing(false); setForm(customer) }}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving' : 'Save Changes'}</button>
            </>
          ) : (
            <button className="btn-ghost flex items-center gap-2" onClick={() => setEditing(true)}>
              <span className="material-symbols-outlined text-[16px]">edit</span>Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="card p-6">
          <div className="text-center mb-5">
            {customer.photoURL ? (
              <img src={customer.photoURL} alt={customer.fullName} className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-secondary" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-2xl font-bold mx-auto">
                {customer.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="font-display text-title-sm text-on-surface mt-3">{customer.fullName}</h2>
            <p className="font-mono text-code-data text-secondary">{customer.passportNumber}</p>
          </div>

          <div className="space-y-3 text-body-sm">
            {[
              { icon: 'public', label: customer.nationality || '--' },
              { icon: 'cake', label: customer.dob || '--' },
              { icon: 'wc', label: customer.gender || '--' },
              { icon: 'phone', label: customer.phone || '--' },
              { icon: 'email', label: customer.email || '--' },
            ].map(({ icon, label }) => (
              <div key={icon} className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-outline-variant text-[11px] text-on-surface-variant">
            <p>Added {format(customer.createdAt, 'dd MMM yyyy')}</p>
          </div>
        </div>

        {/* Edit form or details + applications */}
        <div className="lg:col-span-2 space-y-5">
          {editing && (
            <div className="card p-6">
              <h2 className="font-display text-title-sm text-on-surface mb-4">Edit Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text' },
                  { label: 'Passport Number', key: 'passportNumber', type: 'text' },
                  { label: 'Nationality', key: 'nationality', type: 'text' },
                  { label: 'Date of Birth', key: 'dob', type: 'date' },
                  { label: 'Phone', key: 'phone', type: 'tel' },
                  { label: 'Email', key: 'email', type: 'email' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">{label}</label>
                    <input
                      type={type}
                      value={(form as Record<string, string>)[key] ?? ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          <div className="card">
            <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-display text-title-sm text-on-surface">Applications ({apps.length})</h2>
              <button className="btn-primary text-body-sm px-3 py-1.5" onClick={() => navigate('/applications/new')}>+ New</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {['App. No.', 'Visa Type', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-label-caps text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-body-md text-on-surface-variant">No applications</td></tr>
                ) : apps.map((a) => (
                  <tr key={a.id} onClick={() => navigate(`/applications/${a.id}`)} className="border-b border-outline-variant hover:bg-surface-container-low cursor-pointer">
                    <td className="px-5 py-3 font-mono text-[11px] text-secondary font-medium">{a.applicationNumber}</td>
                    <td className="px-5 py-3 text-body-sm text-on-surface">{a.visaTypeName ?? '--'}</td>
                    <td className="px-5 py-3"><StatusChip status={a.status} size="sm" /></td>
                    <td className="px-5 py-3 text-body-sm text-on-surface-variant">{format(a.createdAt, 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
