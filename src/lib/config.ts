/**
 * Config Manager
 * Reads API keys from localStorage first (set via Settings UI),
 * then falls back to .env variables.
 *
 * Keys are stored in localStorage under "visa_app_config".
 */

const STORAGE_KEY = 'visa_app_config'

export interface AppConfig {
  // Firebase
  firebaseApiKey: string
  firebaseAuthDomain: string
  firebaseProjectId: string
  firebaseStorageBucket: string
  firebaseMessagingSenderId: string
  firebaseAppId: string
  // Supabase
  supabaseUrl: string
  supabaseAnonKey: string
  // OCR
  googleVisionApiKey: string
}

function loadFromStorage(): Partial<AppConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function env(key: string): string {
  return (import.meta.env as Record<string, string>)[key] ?? ''
}

let _cached: Partial<AppConfig> | null = null

export function getConfig(): AppConfig {
  if (!_cached) _cached = loadFromStorage()
  return {
    firebaseApiKey:            _cached.firebaseApiKey            ?? env('VITE_FIREBASE_API_KEY'),
    firebaseAuthDomain:        _cached.firebaseAuthDomain        ?? env('VITE_FIREBASE_AUTH_DOMAIN'),
    firebaseProjectId:         _cached.firebaseProjectId         ?? env('VITE_FIREBASE_PROJECT_ID'),
    firebaseStorageBucket:     _cached.firebaseStorageBucket     ?? env('VITE_FIREBASE_STORAGE_BUCKET'),
    firebaseMessagingSenderId: _cached.firebaseMessagingSenderId ?? env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    firebaseAppId:             _cached.firebaseAppId             ?? env('VITE_FIREBASE_APP_ID'),
    supabaseUrl:               _cached.supabaseUrl               ?? env('VITE_SUPABASE_URL'),
    supabaseAnonKey:           _cached.supabaseAnonKey           ?? env('VITE_SUPABASE_ANON_KEY'),
    googleVisionApiKey:        _cached.googleVisionApiKey        ?? env('VITE_GOOGLE_CLOUD_VISION_API_KEY'),
  }
}

export function saveConfig(config: Partial<AppConfig>): void {
  _cached = { ..._cached, ...config }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_cached))
}

export function clearConfig(): void {
  _cached = null
  localStorage.removeItem(STORAGE_KEY)
}

/** Returns true if the minimum required keys are set */
export function isConfigured(): { firebase: boolean; supabase: boolean; ocr: boolean } {
  const c = getConfig()
  return {
    firebase: !!(c.firebaseApiKey && c.firebaseProjectId && c.firebaseAppId),
    supabase: !!(c.supabaseUrl && c.supabaseAnonKey),
    ocr:      !!(c.googleVisionApiKey),
  }
}
