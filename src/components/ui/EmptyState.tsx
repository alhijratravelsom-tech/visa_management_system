interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-outlined text-on-surface-variant mb-4" style={{ fontSize: 48 }}>
        {icon}
      </span>
      <h3 className="font-display text-title-sm text-on-surface mb-1">{title}</h3>
      {description && <p className="text-body-md text-on-surface-variant mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}
