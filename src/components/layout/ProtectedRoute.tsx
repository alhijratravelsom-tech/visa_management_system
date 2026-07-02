import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isFirebaseConfigured } from '@/firebase/config'
import { PageLoader } from '@/components/ui/Spinner'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  // Show setup screen if Firebase keys are missing
  if (!isFirebaseConfigured()) {
    return <Navigate to="/settings/api-keys" replace />
  }

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
