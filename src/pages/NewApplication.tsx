import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createApplication } from '@/services/applications'
import { listCustomers, findByPassport, createCustomer } from '@/services/customers'
import { listOffices } from '@/services/offices'
import { listVisaTypes } from '@/services/visaTypes'
import { ocrPassportImage, fileToBase64 } from '@/services/ocr'
import { uploadFile } from '@/services/storage'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import type { Customer, Office, VisaType } from '@/services/types'

const STEPS = [
  { number: 1, label: 'Passport Scan', icon: 'badge' },
  { number: 2, label: 'Customer Info', icon: 'person' },
  { number: 3, label: 'Photo Upload', icon: 'portrait' },
  { number: 4, label: 'Visa Details', icon: 'description' },
]

export default function NewApplication() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [scanning, setScanning] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // OCR / Passport
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportPreview, setPassportPreview] = useState<string | null>(null)

  // Customer data
  const [customerData, setCustomerData] = useState({
    fullName: '',
    passportNumber: '',
    nationality: '',
    dob: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    email: '',
  })
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null)

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Visa details
  const [offices, setOffices] = useState<Office[]>([])
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([])
  const [visaForm, setVisaForm] = useState({
    officeId: '',
    visaTypeId: '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([listOffices(), listVisaTypes()]).then(([o, v]) => {
      setOffices(o)
      setVisaTypes(v)
    })
  }, [])

  const handlePassportFile = (file: File) => {
    setPassportFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPassportPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleOCR = async () => {
    if (!passportFile) return
    setScanning(true)
    try {
      const base64 = await fileToBase64(passportFile)
      const result = await ocrPassportImage(base64)
      setCustomerData({
        fullName: result.fullName ?? '',
        passportNumber: result.passportNumber ?? '',
        nationality: result.nationality ?? '',
        dob: result.dob ?? '',
        gender: result.gender ?? 'male',
        phone: '',
        email: '',
      })
      // Check for existing customer
      if (result.passportNumber) {
        const found = await findByPassport(result.passportNumber)
        if (found) {
          setExistingCustomer(found)
          toast.success(`Found existing customer: ${found.fullName}`)
        }
      }
      toast.success('Passport scanned successfully')
      setStep(2)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'OCR failed. Please fill in details manually.')
      setStep(2)
    } finally {
      setScanning(false)
    }
  }

  const handleSubmit = async () => {
    if (!visaForm.visaTypeId) {
      toast.error('Please select a visa type')
      return
    }
    setSubmitting(true)
    try {
      // Upload files
      let passportImageURL: string | undefined
      let photoImageURL: string | undefined

      if (passportFile) {
        const ext = passportFile.name.split('.').pop() ?? 'jpg'
        passportImageURL = await uploadFile(passportFile, 'passports', `passport_${Date.now()}.${ext}`)
      }
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg'
        photoImageURL = await uploadFile(photoFile, 'photos', `photo_${Date.now()}.${ext}`)
      }

      // Create or use existing customer
      let customerId = existingCustomer?.id
      let customerName = existingCustomer?.fullName

      if (!existingCustomer) {
        customerId = await createCustomer({ ...customerData })
        customerName = customerData.fullName
      }

      // Get visa type name
      const vt = visaTypes.find((v) => v.id === visaForm.visaTypeId)
      const office = offices.find((o) => o.id === visaForm.officeId)

      await createApplication({
        customerId: customerId!,
        customerName,
        officeId: visaForm.officeId || undefined,
        officeName: office?.officeName,
        visaTypeId: visaForm.visaTypeId,
        visaTypeName: vt?.name,
        countryCode: vt?.countryCode,
        status: 'submitted',
        financialStatus: 'unpaid',
        passportImageURL,
        photoImageURL,
        notes: visaForm.notes,
      })

      toast.success('Application created successfully!')
      navigate('/applications')
    } catch (err) {
      toast.error('Failed to create application')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/applications')} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-display text-headline-md text-on-surface">New Application</h1>
          <p className="text-body-sm text-on-surface-variant">Step {step} of {STEPS.length}</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Vertical stepper */}
        <div className="w-52 flex-shrink-0">
          <div className="card p-4 space-y-0">
            {STEPS.map((s, idx) => {
              const isDone = step > s.number
              const isActive = step === s.number
              return (
                <div key={s.number} className={`relative flex items-start gap-3 pb-8 last:pb-0`}>
                  {idx < STEPS.length - 1 && (
                    <div className={`absolute left-5 top-10 w-0.5 h-[calc(100%-2.5rem)] ${isDone ? 'bg-secondary' : 'bg-outline-variant'}`} />
                  )}
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10
                    ${isDone ? 'bg-secondary border-secondary text-white'
                    : isActive ? 'bg-secondary-fixed-dim border-secondary text-secondary'
                    : 'bg-surface-container border-outline-variant text-on-surface-variant'}`}
                  >
                    {isDone ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                    )}
                  </div>
                  <div className="pt-1.5">
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      Step {s.number}
                    </p>
                    <p className={`text-body-sm font-medium ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {s.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 card p-6">
          {/* Step 1: Passport */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-title-sm text-on-surface">Scan Passport</h2>
              <p className="text-body-md text-on-surface-variant">Upload a clear image of the passport data page for automatic OCR extraction.</p>

              {passportPreview ? (
                <div className="relative">
                  <img src={passportPreview} alt="Passport" className="w-full max-h-64 object-cover rounded-lg border border-outline-variant" />
                  <button
                    onClick={() => { setPassportFile(null); setPassportPreview(null) }}
                    className="absolute top-2 right-2 bg-surface-container-lowest rounded-full p-1.5 shadow-md text-on-surface-variant hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-outline-variant rounded-xl p-8 text-center cursor-pointer hover:border-secondary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePassportFile(e.target.files[0])}
                  />
                  <span className="material-symbols-outlined text-on-surface-variant text-4xl block mb-2">upload_file</span>
                  <p className="text-body-md text-on-surface-variant">Click to upload or drag and drop</p>
                  <p className="text-body-sm text-outline mt-1">PNG, JPG, HEIF up to 10MB</p>
                </label>
              )}

              <div className="flex gap-3">
                <button
                  className="btn-ghost"
                  onClick={() => setStep(2)}
                >
                  Skip -- Enter Manually
                </button>
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={handleOCR}
                  disabled={!passportFile || scanning}
                >
                  {scanning ? <><Spinner size={16} /> Scanning</> : <><span className="material-symbols-outlined text-[16px]">document_scanner</span>Scan & Continue</>}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Customer Info */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-title-sm text-on-surface">Customer Information</h2>
              {existingCustomer && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified_user</span>
                  <div>
                    <p className="text-body-md font-semibold text-emerald-800">Existing customer found</p>
                    <p className="text-body-sm text-emerald-700">Using profile: {existingCustomer.fullName}  {existingCustomer.passportNumber}</p>
                    <button className="text-body-sm text-emerald-600 underline mt-1" onClick={() => setExistingCustomer(null)}>
                      Use new customer instead
                    </button>
                  </div>
                </div>
              )}
              {!existingCustomer && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'As shown on passport' },
                    { label: 'Passport Number', key: 'passportNumber', type: 'text', placeholder: 'A12345678' },
                    { label: 'Nationality', key: 'nationality', type: 'text', placeholder: 'e.g. SOM' },
                    { label: 'Date of Birth', key: 'dob', type: 'date' },
                    { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+252 61 234 5678' },
                    { label: 'Email', key: 'email', type: 'email', placeholder: 'customer@email.com' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">{label}</label>
                      <input
                        type={type}
                        value={(customerData as Record<string, string>)[key]}
                        onChange={(e) => setCustomerData({ ...customerData, [key]: e.target.value })}
                        className="input-field"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Gender</label>
                    <select value={customerData.gender} onChange={(e) => setCustomerData({ ...customerData, gender: e.target.value as 'male' | 'female' })} className="input-field">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button className="btn-ghost" onClick={() => setStep(1)}> Back</button>
                <button className="btn-primary" onClick={() => setStep(3)}>Continue </button>
              </div>
            </div>
          )}

          {/* Step 3: Photo */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-title-sm text-on-surface">Applicant Photo</h2>
              <p className="text-body-md text-on-surface-variant">Upload a recent passport-style photo (white background, front-facing).</p>

              {photoPreview ? (
                <div className="relative inline-block">
                  <img src={photoPreview} alt="Photo" className="w-36 h-44 object-cover rounded-lg border border-outline-variant" />
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                    className="absolute top-1 right-1 bg-surface-container-lowest rounded-full p-1 shadow text-on-surface-variant hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-outline-variant rounded-xl p-8 text-center cursor-pointer hover:border-secondary transition-colors max-w-xs">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setPhotoFile(file)
                      const reader = new FileReader()
                      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
                      reader.readAsDataURL(file)
                    }}
                  />
                  <span className="material-symbols-outlined text-on-surface-variant text-4xl block mb-2">portrait</span>
                  <p className="text-body-md text-on-surface-variant">Upload Photo</p>
                </label>
              )}

              <div className="flex gap-3">
                <button className="btn-ghost" onClick={() => setStep(2)}> Back</button>
                <button className="btn-ghost" onClick={() => setStep(4)}>Skip</button>
                <button className="btn-primary" onClick={() => setStep(4)}>Continue </button>
              </div>
            </div>
          )}

          {/* Step 4: Visa details */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-title-sm text-on-surface">Visa Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Visa Type *</label>
                  <select
                    value={visaForm.visaTypeId}
                    onChange={(e) => setVisaForm({ ...visaForm, visaTypeId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select visa type</option>
                    {visaTypes.map((vt) => (
                      <option key={vt.id} value={vt.id}>{vt.name} ({vt.countryName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Submitting Office</label>
                  <select
                    value={visaForm.officeId}
                    onChange={(e) => setVisaForm({ ...visaForm, officeId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Direct (No Office)</option>
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>{o.officeName}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Notes</label>
                  <textarea
                    value={visaForm.notes}
                    onChange={(e) => setVisaForm({ ...visaForm, notes: e.target.value })}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Additional notes or special instructions"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-surface-container-low rounded-lg p-4 space-y-2">
                <p className="text-label-caps text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">Summary</p>
                <p className="text-body-md text-on-surface"><span className="text-on-surface-variant">Customer:</span> {(existingCustomer?.fullName ?? customerData.fullName) || '--'}</p>
                <p className="text-body-md text-on-surface"><span className="text-on-surface-variant">Passport:</span> {(existingCustomer?.passportNumber ?? customerData.passportNumber) || '--'}</p>
                <p className="text-body-md text-on-surface"><span className="text-on-surface-variant">Visa:</span> {visaTypes.find((v) => v.id === visaForm.visaTypeId)?.name ?? '--'}</p>
              </div>

              <div className="flex gap-3">
                <button className="btn-ghost" onClick={() => setStep(3)}> Back</button>
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <><Spinner size={16} /> Submitting</> : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
