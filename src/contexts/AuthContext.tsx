import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '@/firebase/config'

export type UserRole = 'owner' | 'admin' | 'staff' | 'viewer'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  photoURL?: string
  status: 'active' | 'suspended'
  lastLogin?: Date
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  hasPermission: (permission: string) => boolean
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['*'],
  admin: [
    'applications.read', 'applications.write', 'applications.delete',
    'customers.read', 'customers.write', 'customers.delete',
    'offices.read', 'offices.write',
    'financials.read', 'financials.write',
    'reports.read',
    'settings.read', 'settings.write',
    'users.read', 'users.write',
    'audit.read',
  ],
  staff: [
    'applications.read', 'applications.write',
    'customers.read', 'customers.write',
    'offices.read',
    'financials.read',
    'reports.read',
  ],
  viewer: [
    'applications.read',
    'customers.read',
    'offices.read',
    'financials.read',
    'reports.read',
  ],
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If Firebase isn't configured yet, skip auth listener -- show app unconfigured
    if (!isFirebaseConfigured()) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid))
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile)
          } else {
            // Bootstrap first-time user as owner
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              displayName: firebaseUser.displayName ?? firebaseUser.email ?? 'User',
              role: 'owner',
              status: 'active',
            }
            await setDoc(doc(db, 'profiles', firebaseUser.uid), {
              ...newProfile,
              createdAt: serverTimestamp(),
            })
            setProfile(newProfile)
          }
        } catch {
          // Offline or first load -- set minimal profile
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? 'User',
            role: 'admin',
            status: 'active',
          })
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    // Update lastLogin
    if (auth.currentUser) {
      await setDoc(
        doc(db, 'profiles', auth.currentUser.uid),
        { lastLogin: serverTimestamp() },
        { merge: true }
      )
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false
    const perms = ROLE_PERMISSIONS[profile.role]
    return perms.includes('*') || perms.includes(permission)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, resetPassword, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
