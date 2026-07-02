import { useState } from 'react'
import { ocrPassportImage, fileToBase64, type PassportOCRResult } from '@/services/ocr'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

interface ScanResult {
  fileName: string
  status: 'pending' | 'scanning' | 'done' | 'error'
  data?: PassportOCRResult
  error?: string
}

export default function BulkUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<ScanResult[]>([])
  const [processing, setProcessing] = useState(false)

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const arr = Array.from(newFiles).filter((f) => f.type.startsWith('image/'))
    setFiles(arr)
    setResults(arr.map((f) => ({ fileName: f.name, status: 'pending' })))
  }

  const processAll = async () => {
    setProcessing(true)
    for (let i = 0; i < files.length; i++) {
      setResults((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'scanning' } : r))
      try {
        const base64 = await fileToBase64(files[i])
        const data = await ocrPassportImage(base64)
        setResults((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'done', data } : r))
      } catch (err: unknown) {
        setResults((prev) => prev.map((r, idx) =>
          idx === i ? { ...r, status: 'error', error: (err as Error).message } : r
        ))
      }
    }
    setProcessing(false)
    toast.success('Batch scan complete')
  }

  const doneCount = results.filter((r) => r.status === 'done').length
  const errorCount = results.filter((r) => r.status === 'error').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-headline-md text-on-surface">Bulk Visa Upload</h1>
        <p className="text-body-md text-on-surface-variant mt-0.5">Upload multiple passport scans for batch OCR processing and visa matching.</p>
      </div>

      {/* Upload zone */}
      <div className="card p-6">
        <label className="block border-2 border-dashed border-outline-variant rounded-xl p-10 text-center cursor-pointer hover:border-secondary transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span className="material-symbols-outlined text-on-surface-variant text-5xl block mb-3">upload_file</span>
          <p className="font-display text-title-sm text-on-surface">Drop passport images here</p>
          <p className="text-body-md text-on-surface-variant mt-1">or click to browse -- accepts PNG, JPG, HEIF</p>
          {files.length > 0 && (
            <p className="mt-3 text-body-sm text-secondary font-semibold">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
          )}
        </label>

        {files.length > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={processAll}
              disabled={processing}
            >
              {processing ? <><Spinner size={16} /> Processing</> : <><span className="material-symbols-outlined text-[16px]">document_scanner</span>Process All ({files.length})</>}
            </button>
            <button className="btn-ghost" onClick={() => { setFiles([]); setResults([]) }}>
              Clear
            </button>
            {results.length > 0 && (
              <div className="flex gap-3 ml-auto text-body-sm">
                <span className="text-emerald-600 font-semibold"> {doneCount} done</span>
                {errorCount > 0 && <span className="text-error font-semibold"> {errorCount} errors</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results table */}
      {results.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low">
            <h2 className="font-display text-title-sm text-on-surface">OCR Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  {['File', 'Status', 'Full Name', 'Passport No.', 'Nationality', 'DOB', 'Gender'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-label-caps text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-outline-variant">
                    <td className="px-5 py-3 text-body-sm text-on-surface max-w-32 truncate">{r.fileName}</td>
                    <td className="px-5 py-3">
                      {r.status === 'pending' && <span className="text-on-surface-variant text-body-sm">Pending</span>}
                      {r.status === 'scanning' && <span className="flex items-center gap-1 text-secondary text-body-sm"><Spinner size={14} /> Scanning</span>}
                      {r.status === 'done' && <span className="text-emerald-600 text-body-sm font-semibold"> Done</span>}
                      {r.status === 'error' && <span className="text-error text-body-sm"> Error</span>}
                    </td>
                    <td className="px-5 py-3 text-body-sm text-on-surface">{r.data?.fullName ?? (r.status === 'error' ? <span className="text-error text-[11px]">{r.error}</span> : '--')}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-secondary">{r.data?.passportNumber ?? '--'}</td>
                    <td className="px-5 py-3 text-body-sm text-on-surface-variant">{r.data?.nationality ?? '--'}</td>
                    <td className="px-5 py-3 text-body-sm text-on-surface-variant">{r.data?.dob ?? '--'}</td>
                    <td className="px-5 py-3 text-body-sm text-on-surface-variant capitalize">{r.data?.gender ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
