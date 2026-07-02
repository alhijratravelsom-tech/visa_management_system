import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { PageLoader } from '@/components/ui/Spinner'

// Lazy-load pages
const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Applications = lazy(() => import('@/pages/Applications'))
const ApplicationDetail = lazy(() => import('@/pages/ApplicationDetail'))
const NewApplication = lazy(() => import('@/pages/NewApplication'))
const Customers = lazy(() => import('@/pages/Customers'))
const CustomerProfile = lazy(() => import('@/pages/CustomerProfile'))
const Offices = lazy(() => import('@/pages/Offices'))
const BulkUpload = lazy(() => import('@/pages/BulkUpload'))
const Financial = lazy(() => import('@/pages/Financial'))
const Reports = lazy(() => import('@/pages/Reports'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const UserProfile = lazy(() => import('@/pages/UserProfile'))
const SettingsGeneral = lazy(() => import('@/pages/Settings/General'))
const VisaTypes = lazy(() => import('@/pages/Settings/VisaTypes'))
const ApiKeys = lazy(() => import('@/pages/Settings/ApiKeys'))
const AuditLog = lazy(() => import('@/pages/Security/AuditLog'))
const Roles = lazy(() => import('@/pages/Security/Roles'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'text-body-sm font-sans',
            duration: 4000,
            style: {
              background: '#f9f9ff',
              color: '#111c2d',
              border: '1px solid #c4c6ce',
              borderRadius: '8px',
              boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
            },
          }}
        />
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><PageLoader /></div>}>
          <Routes>
            {/* Public -- always accessible */}
            <Route path="/login" element={<Login />} />
            <Route path="/settings/api-keys" element={<ApiKeys />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Applications */}
                <Route path="/applications" element={<Applications />} />
                <Route path="/applications/new" element={<NewApplication />} />
                <Route path="/applications/:id" element={<ApplicationDetail />} />
                <Route path="/applications/:id/edit" element={<NewApplication />} />

                {/* Customers */}
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerProfile />} />

                {/* Offices */}
                <Route path="/offices" element={<Offices />} />

                {/* Bulk Upload */}
                <Route path="/bulk-upload" element={<BulkUpload />} />

                {/* Financial */}
                <Route path="/financial" element={<Financial />} />

                {/* Reports */}
                <Route path="/reports" element={<Reports />} />

                {/* Notifications */}
                <Route path="/notifications" element={<Notifications />} />

                {/* Profile */}
                <Route path="/profile" element={<UserProfile />} />

                {/* Settings */}
                <Route path="/settings" element={<Navigate to="/settings/api-keys" replace />} />
                <Route path="/settings/general" element={<SettingsGeneral />} />
                <Route path="/settings/visa-types" element={<VisaTypes />} />

                {/* Security */}
                <Route path="/security" element={<Navigate to="/security/roles" replace />} />
                <Route path="/security/roles" element={<Roles />} />
                <Route path="/security/audit-log" element={<AuditLog />} />
              </Route>
            </Route>
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
