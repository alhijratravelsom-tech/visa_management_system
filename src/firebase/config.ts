import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getConfig } from '@/lib/config'

const cfg = getConfig()

const firebaseConfig = {
  apiKey:            cfg.firebaseApiKey            || 'placeholder-api-key',
  authDomain:        cfg.firebaseAuthDomain        || 'placeholder.firebaseapp.com',
  projectId:         cfg.firebaseProjectId         || 'placeholder-project',
  storageBucket:     cfg.firebaseStorageBucket     || 'placeholder.appspot.com',
  messagingSenderId: cfg.firebaseMessagingSenderId || '000000000000',
  appId:             cfg.firebaseAppId             || '1:000000000000:web:placeholder',
}

// Avoid duplicate app initialization during hot reload
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)

export function isFirebaseConfigured(): boolean {
  const c = getConfig()
  return !!(c.firebaseApiKey && c.firebaseProjectId && c.firebaseAppId)
}
