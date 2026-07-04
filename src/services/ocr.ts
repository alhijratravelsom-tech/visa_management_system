/**
 * OCR Service -- Google Cloud Vision API
 * Performs passport MRZ parsing and field extraction.
 */

import { getConfig } from '@/lib/config'

export interface PassportOCRResult {
  fullName?: string
  passportNumber?: string
  nationality?: string
  dob?: string
  expiryDate?: string
  gender?: 'male' | 'female'
  issuingCountry?: string
  rawText: string
}

export async function ocrPassportImage(base64Image: string): Promise<PassportOCRResult> {
  const { googleVisionApiKey } = getConfig()
  if (!googleVisionApiKey) {
    throw new Error('Google Cloud Vision API key is not configured. Go to Settings  API Keys.')
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
    }
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const apiMessage = data?.error?.message || response.statusText || 'Unknown error'
    throw new Error(`Vision API error (${response.status}): ${apiMessage}`)
  }

  // Vision can also return a per-request error with HTTP 200
  const reqError = data?.responses?.[0]?.error
  if (reqError?.message) {
    throw new Error(`Vision API error: ${reqError.message}`)
  }

  const rawText: string = data?.responses?.[0]?.fullTextAnnotation?.text ?? ''

  return parseMRZ(rawText)
}

function parseMRZ(text: string): PassportOCRResult {
  const lines = text.split('\n').map((l) => l.trim())

  // Find MRZ lines (TD3 format: 2 lines of 44 chars each)
  const mrzLines = lines.filter((l) => /^[A-Z0-9<]{30,44}$/.test(l))

  const result: PassportOCRResult = { rawText: text }

  if (mrzLines.length >= 2) {
    const line1 = mrzLines[mrzLines.length - 2]
    const line2 = mrzLines[mrzLines.length - 1]

    // Line 1: Type, country, name
    if (line1.length >= 44) {
      const nameField = line1.substring(5, 44)
      const [surname, given] = nameField.split('<<')
      result.fullName = [
        given?.replace(/</g, ' ').trim(),
        surname?.replace(/</g, ' ').trim(),
      ]
        .filter(Boolean)
        .join(' ')
      result.issuingCountry = line1.substring(2, 5)
    }

    // Line 2: Passport no, nationality, DOB, sex, expiry
    if (line2.length >= 44) {
      result.passportNumber = line2.substring(0, 9).replace(/</g, '')
      result.nationality = line2.substring(10, 13)
      const dobRaw = line2.substring(13, 19)
      result.dob = formatMRZDate(dobRaw)
      const sexChar = line2.substring(20, 21)
      result.gender = sexChar === 'F' ? 'female' : 'male'
      const expiryRaw = line2.substring(21, 27)
      result.expiryDate = formatMRZDate(expiryRaw)
    }
  }

  // Fallback: try to extract from raw text
  if (!result.passportNumber) {
    const passportMatch = text.match(/[A-Z]{1,2}\d{6,9}/)
    if (passportMatch) result.passportNumber = passportMatch[0]
  }

  return result
}

function formatMRZDate(raw: string): string {
  if (raw.length !== 6) return raw
  const yy = raw.substring(0, 2)
  const mm = raw.substring(2, 4)
  const dd = raw.substring(4, 6)
  const year = parseInt(yy) > 30 ? `19${yy}` : `20${yy}`
  return `${year}-${mm}-${dd}`
}

/** Convert a File to base64 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip data URL prefix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
