import { createClient } from '@supabase/supabase-js'
import { getConfig } from './config'

function buildClient() {
  const { supabaseUrl, supabaseAnonKey } = getConfig()
  return createClient(
    supabaseUrl  || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
  )
}

// Re-build client each time so it picks up config saved via Settings UI.
// In production with .env set at build time this is effectively a singleton.
export function getSupabase() {
  return buildClient()
}

// Convenience default export (uses current config at import time)
export const supabase = buildClient()
