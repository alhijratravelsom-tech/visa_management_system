import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { updateDocById } from '@/services/base'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import toast from 'react-hot-toast'

export default function UserProfile() {
  const { profile, user } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateDocById('profiles', user.uid, { displayName })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user || !user.email) return
    if (pwForm.next !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.next.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setChangingPw(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, pwForm.current)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, pwForm.next)
      toast.success('Password changed successfully')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch {
      toast.error('Re-authentication failed. Check your current password.')
    } finally {
      setChangingPw(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="font-display text-headline-md text-on-surface">My Profile</h1>
        <p className="text-body-sm text-on-surface-variant mt-0.5">Manage your account settings and security</p>
      </div>

      {/* Avatar + info */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-2xl font-bold flex-shrink-0">
          {profile?.displayName?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <div>
          <p className="font-display text-title-sm text-on-surface">{profile?.displayName}</p>
          <p className="text-body-sm text-on-surface-variant">{user?.email}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary-fixed text-secondary uppercase tracking-wider">
            {profile?.role}
          </span>
        </div>
      </div>

      {/* Edit name */}
      <div className="card p-6 space-y-4">
        <h2 className="font-display text-title-sm text-on-surface">Personal Details</h2>
        <div>
          <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-field max-w-sm"
          />
        </div>
        <div>
          <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Email Address</label>
          <input type="email" value={user?.email ?? ''} disabled className="input-field max-w-sm opacity-60 cursor-not-allowed" />
        </div>
        <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
          {saving ? 'Saving' : 'Save Changes'}
        </button>
      </div>

      {/* Change password */}
      <div className="card p-6 space-y-4">
        <h2 className="font-display text-title-sm text-on-surface">Change Password</h2>
        <div>
          <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Current Password</label>
          <input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className="input-field max-w-sm" />
        </div>
        <div>
          <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">New Password</label>
          <input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className="input-field max-w-sm" />
        </div>
        <div>
          <label className="block text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-semibold">Confirm New Password</label>
          <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="input-field max-w-sm" />
        </div>
        <button className="btn-primary" onClick={handleChangePassword} disabled={changingPw}>
          {changingPw ? 'Updating' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}
