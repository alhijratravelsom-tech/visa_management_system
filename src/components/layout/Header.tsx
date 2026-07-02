import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/applications?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center flex-1 max-w-md">
        <div className="relative w-full group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px] group-focus-within:text-secondary transition-colors">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications, passports, or names"
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
          />
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full hover:bg-surface-container-highest cursor-pointer transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-xs font-bold">
            {profile?.displayName?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <span className="text-body-sm text-on-surface font-medium hidden sm:block">
            {profile?.displayName ?? 'User'}
          </span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            expand_more
          </span>
        </button>
      </div>
    </header>
  )
}
