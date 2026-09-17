import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  icon?: ReactNode
}

export default function EmptyState({
  title,
  description,
  actionLabel = 'عرض كل المنتجات',
  actionTo = '/products',
  icon,
}: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      {icon && <div className="mb-4 text-accent">{icon}</div>}
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      {description && <p className="mt-2 text-muted">{description}</p>}
      {actionTo && (
        <Link to={actionTo} className="mt-6">
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  )
}
