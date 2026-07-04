import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getConfig } from './config'

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Built lazily (no top-level client) so an invalid saved URL can never
// crash the whole app at module-import time. Invalid values fall back
// to a harmless placeholder; storage features simply won't work until
// a valid URL is configured in Settings → API Keys.
export function getSupabase(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getConfig()
  const url = isValidHttpUrl(supabaseUrl) ? supabaseUrl : PLACEHOLDER_URL
  const key = supabaseAnonKey?.trim() || 'placeholder'
  if (url === PLACEHOLDER_URL && supabaseUrl) {
    console.warn('Ignoring invalid Supabase URL from config:', supabaseUrl)
  }
  return createClient(url, key)
}
