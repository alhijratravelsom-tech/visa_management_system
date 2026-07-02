const ROLES = [
  {
    name: 'Owner',
    icon: 'manage_accounts',
    color: 'bg-purple-100 text-purple-700',
    description: 'Full system access. Can manage all users, settings, and data.',
    permissions: ['All permissions'],
  },
  {
    name: 'Admin',
    icon: 'admin_panel_settings',
    color: 'bg-blue-100 text-blue-700',
    description: 'Manages applications, customers, offices, and settings. Cannot manage owner accounts.',
    permissions: ['Applications (CRUD)', 'Customers (CRUD)', 'Offices (Read/Write)', 'Financials', 'Reports', 'Settings', 'Users (Read/Write)', 'Audit Log'],
  },
  {
    name: 'Staff',
    icon: 'person',
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Processes visa applications and manages customer records.',
    permissions: ['Applications (Read/Write)', 'Customers (Read/Write)', 'Offices (Read)', 'Financials (Read)', 'Reports (Read)'],
  },
  {
    name: 'Viewer',
    icon: 'visibility',
    color: 'bg-amber-100 text-amber-700',
    description: 'Read-only access to applications and reports.',
    permissions: ['Applications (Read)', 'Customers (Read)', 'Offices (Read)', 'Financials (Read)', 'Reports (Read)'],
  },
]

export default function Roles() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-headline-md text-on-surface">Roles & Permissions</h1>
        <p className="text-body-sm text-on-surface-variant mt-0.5">System roles and their access levels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ROLES.map((role) => (
          <div key={role.name} className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.color.split(' ')[0]}`}>
                <span className={`material-symbols-outlined ${role.color.split(' ')[1]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {role.icon}
                </span>
              </div>
              <h2 className="font-display text-title-sm text-on-surface">{role.name}</h2>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-4">{role.description}</p>
            <div className="space-y-1.5">
              {role.permissions.map((p) => (
                <div key={p} className="flex items-center gap-2 text-body-sm text-on-surface">
                  <span className="material-symbols-outlined text-emerald-600 text-[14px]">check_circle</span>
                  {p}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-[20px]">info</span>
          <div>
            <p className="text-body-md font-semibold text-amber-800">Roles are managed in Firebase</p>
            <p className="text-body-sm text-amber-700 mt-0.5">
              To assign or change user roles, update the <code className="font-mono text-[12px] bg-amber-100 px-1 rounded">role</code> field
              in the <code className="font-mono text-[12px] bg-amber-100 px-1 rounded">profiles</code> Firestore collection.
              The first user to sign in is automatically assigned the Owner role.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
