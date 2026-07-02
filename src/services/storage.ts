/**
 * Storage Service -- Supabase Storage
 * Handles all file uploads: passport scans, photos, visa files, receipts.
 */

import { format } from 'date-fns'
import { getSupabase } from '@/lib/supabase'

const BUCKET = 'visa-files'

type FileCategory = 'passports' | 'photos' | 'visas' | 'receipts'

function buildPath(category: FileCategory, fileName: string): string {
  const now = new Date()
  const year = format(now, 'yyyy')
  const month = format(now, 'MM')
  return `${category}/${year}/${month}/${fileName}`
}

export async function uploadFile(
  file: File,
  category: FileCategory,
  fileName: string
): Promise<string> {
  const client = getSupabase()
  const path = buildPath(category, fileName)
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  const { data } = client.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteFile(publicUrl: string): Promise<void> {
  const client = getSupabase()
  const urlPath = new URL(publicUrl).pathname
  const bucketIdx = urlPath.indexOf(`/${BUCKET}/`)
  if (bucketIdx === -1) return
  const filePath = urlPath.slice(bucketIdx + BUCKET.length + 2)
  const { error } = await client.storage.from(BUCKET).remove([filePath])
  if (error) throw new Error(`Delete failed: ${error.message}`)
}

export async function getSignedUrl(publicUrl: string, expiresIn = 3600): Promise<string> {
  const client = getSupabase()
  const urlPath = new URL(publicUrl).pathname
  const bucketIdx = urlPath.indexOf(`/${BUCKET}/`)
  if (bucketIdx === -1) return publicUrl
  const filePath = urlPath.slice(bucketIdx + BUCKET.length + 2)
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(filePath, expiresIn)
  if (error || !data) return publicUrl
  return data.signedUrl
}
