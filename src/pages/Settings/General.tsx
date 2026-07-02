import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SettingsGeneral() {
  const [form, setForm] = useState({
    systemName: 'Pro Visa Systems',
    timezone: 'Africa/Mogadishu',
    language: 'en',
    currency: 'USD',
    dateFormat: 'DD/MM/YYYY',
    autoArchiveDays: '90',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    toast.success('Settings saved')
    setSaving(false)
  }

  const FIELDS = [
    { label: 'System Name', key: 'systemName', type: 'text' },
    { label: 'Timezone', key: 'timezone', type: 'text' },
    { label: 'Language', key: 'language', type: 'select', options: [{ value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }, { value: 'so', label: 'Somali' }] },
    { label: 'Currency', key: 'currency', type: 'select', options: [{ value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR ()' }, { value: 'GBP', label: 'GBP ()' }] },
    { label: 'Date Format', key: 'dateFormat', type: 'select', options: [{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }] },
    { label: 'Auto-archive after (days)', key: 'autoArchiveDays', type: 'number' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-headline-md text-on-surface">General Settings</h1>
        <p className="text-body-sm text-on-surface-variant mt-0.5">System-wide configuration options</p>
      </div>

      <div className="card p-6 space-y-5 max-w-2xl">
        {FIELDS.map(({ label, key, type, options }) => (
          <div key={key}>
            <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">{label}</label>
            {type === 'select' ? (
              <select
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input-field max-w-xs"
              >
                {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                type={type}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input-field max-w-xs"
              />
            )}
          </div>
        ))}

        <div className="pt-4 border-t border-outline-variant">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
