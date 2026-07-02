import { useState, useEffect } from 'react'
import { getConfig, saveConfig, clearConfig, isConfigured, type AppConfig } from '@/lib/config'
import { isFirebaseConfigured } from '@/firebase/config'
import toast from 'react-hot-toast'

interface FieldDef {
  key: keyof AppConfig
  label: string
  placeholder: string
  sensitive?: boolean
  hint?: string
}

const SECTIONS: { title: string; icon: string; color: string; fields: FieldDef[] }[] = [
  {
    title: 'Firebase',
    icon: 'local_fire_department',
    color: 'bg-orange-100 text-orange-600',
    fields: [
      { key: 'firebaseApiKey',            label: 'API Key',             placeholder: 'AIzaSy...', sensitive: true },
      { key: 'firebaseAuthDomain',        label: 'Auth Domain',         placeholder: 'your-project.firebaseapp.com' },
      { key: 'firebaseProjectId',         label: 'Project ID',          placeholder: 'your-project-id' },
      { key: 'firebaseStorageBucket',     label: 'Storage Bucket',      placeholder: 'your-project.appspot.com' },
      { key: 'firebaseMessagingSenderId', label: 'Messaging Sender ID', placeholder: '123456789' },
      { key: 'firebaseAppId',             label: 'App ID',              placeholder: '1:123:web:abc', sensitive: true },
    ],
  },
  {
    title: 'Supabase Storage',
    icon: 'storage',
    color: 'bg-emerald-100 text-emerald-600',
    fields: [
      {
        key: 'supabaseUrl',
        label: 'Project URL',
        placeholder: 'https://xxxxxxxxxxxx.supabase.co',
        hint: 'Settings  API  Project URL',
      },
      {
        key: 'supabaseAnonKey',
        label: 'Anon / Public Key',
        placeholder: 'eyJhbGci... or sb_publishable_...',
        sensitive: true,
        hint: 'Settings  API  anon public key',
      },
    ],
  },
  {
    title: 'Google Cloud Vision (OCR)',
    icon: 'document_scanner',
    color: 'bg-blue-100 text-blue-600',
    fields: [
      {
        key: 'googleVisionApiKey',
        label: 'API Key',
        placeholder: 'AIzaSy...',
        sensitive: true,
        hint: 'console.cloud.google.com  APIs  Vision API  Credentials',
      },
    ],
  },
]

export default function ApiKeys() {
  const isSetupMode = !isFirebaseConfigured()
  const [form, setForm] = useState<AppConfig>({
    firebaseApiKey: '',
    firebaseAuthDomain: '',
    firebaseProjectId: '',
    firebaseStorageBucket: '',
    firebaseMessagingSenderId: '',
    firebaseAppId: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    googleVisionApiKey: '',
  })
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ firebase: false, supabase: false, ocr: false })

  useEffect(() => {
    const cfg = getConfig()
    setForm(cfg)
    setStatus(isConfigured())
  }, [])

  const handleChange = (key: keyof AppConfig, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      saveConfig(form)
      setStatus(isConfigured())
      toast.success('Keys saved! Reloading now')
      // Small delay so user sees the toast, then reload to reinit Firebase
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      toast.error('Failed to save API keys')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    clearConfig()
    const cfg = getConfig() // re-reads from .env
    setForm(cfg)
    setStatus(isConfigured())
    toast.success('Saved keys cleared -- now using .env values')
  }

  const toggleReveal = (key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const statusIcon = (ok: boolean) => ok
    ? <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
    : <span className="material-symbols-outlined text-amber-500 text-[18px]">warning</span>

  const pageContent = (
    <div className="space-y-6 max-w-3xl">
      {/* Setup mode banner */}
      {isSetupMode && (
        <div className="card p-5 border-primary bg-primary-container/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[24px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
          <div>
            <p className="text-title-sm font-semibold text-primary">Welcome -- First-time Setup</p>
            <p className="text-body-sm text-on-surface mt-0.5">
              Firebase is not configured yet. Enter your credentials below and click <strong>Save API Keys</strong>. The app will reload automatically and log you in.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-headline-md text-on-surface">API Keys</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Configure external service credentials. Keys are saved in your browser and override .env values.
          </p>
        </div>
        <button
          className="btn-ghost text-body-sm flex items-center gap-1.5 text-error hover:bg-error-container"
          onClick={handleClear}
        >
          <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
          Clear saved keys
        </button>
      </div>

      {/* Status badges */}
      <div className="card p-4 flex flex-wrap gap-4">
        <p className="text-label-caps text-on-surface-variant uppercase tracking-wider self-center">Connection Status:</p>
        {[
          { label: 'Firebase', ok: status.firebase },
          { label: 'Supabase', ok: status.supabase },
          { label: 'Vision OCR', ok: status.ocr },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-1.5">
            {statusIcon(ok)}
            <span className={`text-body-sm font-medium ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.title} className="card overflow-hidden">
          {/* Section header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant bg-surface-container-low">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${section.color.split(' ')[0]}`}>
              <span className={`material-symbols-outlined text-[18px] ${section.color.split(' ')[1]}`}
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {section.icon}
              </span>
            </div>
            <h2 className="font-display text-title-sm text-on-surface">{section.title}</h2>
          </div>

          {/* Fields */}
          <div className="p-6 space-y-4">
            {section.fields.map(({ key, label, placeholder, sensitive, hint }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-label-caps text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                    {label}
                  </label>
                  {hint && (
                    <span className="text-[11px] text-on-surface-variant italic">{hint}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={sensitive && !revealed[key] ? 'password' : 'text'}
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    className="input-field pr-10 font-mono text-[13px]"
                  />
                  {sensitive && (
                    <button
                      type="button"
                      onClick={() => toggleReveal(key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                      title={revealed[key] ? 'Hide' : 'Show'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {revealed[key] ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  )}
                </div>
                {/* Show tick if value is set */}
                {form[key] && (
                  <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">check</span> Key is set
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          className="btn-primary flex items-center gap-2 px-6"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save API Keys
            </>
          )}
        </button>
        <p className="text-body-sm text-on-surface-variant">
          Changes apply after page reload
        </p>
      </div>

      {/* Security note */}
      <div className="card p-4 border-amber-200 bg-amber-50 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-600 text-[20px] flex-shrink-0">info</span>
        <div>
          <p className="text-body-sm font-semibold text-amber-800">Security Note</p>
          <p className="text-body-sm text-amber-700 mt-0.5">
            Keys are stored in <strong>browser localStorage</strong> -- they are never sent to any server.
            Only use this on trusted devices. For production deployments, prefer setting keys in your <code className="font-mono text-[11px] bg-amber-100 px-1 rounded">.env</code> file instead.
          </p>
        </div>
      </div>
    </div>
  )

  // If accessed without auth (setup mode), wrap in a centered page shell
  if (isSetupMode) {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <div>
              <h1 className="font-display text-[17px] font-bold text-on-surface leading-tight">VisaGov Portal</h1>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">Setup</p>
            </div>
          </div>
          {pageContent}
        </div>
      </div>
    )
  }

  return pageContent
}
