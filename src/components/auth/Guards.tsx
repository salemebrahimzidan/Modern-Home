import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Loading from '../common/Loading'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../hooks/useLocale'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, session } = useAuth()
  const { t } = useLocale()
  const location = useLocation()

  if (!ready) return <Loading label={t('common.loading')} />
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
