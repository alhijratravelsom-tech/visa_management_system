import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface NavItem {
  to: string
  icon: string
  label: string
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/applications/new', icon: 'add_circle', label: 'New Application' },
  { to: '/applications', icon: 'description', label: 'Applications' },
  { to: '/customers', icon: 'group', label: 'Customers' },
  { to: '/offices', icon: 'domain', label: 'Offices & Agents' },
  { to: '/bulk-upload', icon: 'upload_file', label: 'Bulk Visa Upload' },
  { to: '/financial', icon: 'payments', label: 'Financials' },
  { to: '/reports', icon: 'assessment', label: 'Reports' },
  { to: '/notifications', icon: 'notifications', label: 'Notifications' },
]

const BOTTOM_NAV: NavItem[] = [
  { to: '/settings/general', icon: 'settings', label: 'Settings', permission: 'settings.read' },
  { to: '/settings/api-keys', icon: 'key', label: 'API Keys', permission: 'settings.write' },
  { to: '/security', icon: 'security', label: 'Security', permission: 'users.read' },
]

export function Sidebar() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-sidebar-width bg-primary-container flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center flex-shrink-0">
          <span
            className="material-symbols-outlined text-on-secondary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_balance
          </span>
        </div>
        <div>
          <h1 className="font-display text-[15px] font-bold text-on-primary leading-tight">
            VisaGov Portal
          </h1>
          <p className="text-on-primary-container text-[10px] font-medium tracking-wider uppercase">
            Official Admin Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/applications/new'}
            className={({ isActive }) =>
              `nav-item text-body-md ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="h-px bg-white/10 my-3 mx-2" />

        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item text-body-md ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-white/10 bg-primary/20">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm flex-shrink-0">
            {profile?.displayName?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-on-primary text-sm font-semibold truncate">{profile?.displayName ?? 'User'}</p>
            <p className="text-on-primary-container text-xs capitalize truncate">{profile?.role ?? 'staff'}</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-on-primary-container hover:text-white transition-colors w-full text-body-sm"
        >
          <span className="material-symbols-outlined text-[1
8px]">logout</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
