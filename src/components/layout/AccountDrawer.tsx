import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Mail, Package, Phone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../hooks/useLocale'

export default function AccountDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, user, signOut } = useAuth()
  const { t } = useLocale()
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  const name = profile?.fullName || user?.email || ''

  return (
    <div className="account-drawer-root">
      <button type="button" className="account-drawer-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <aside className="account-drawer" role="dialog" aria-modal="true" aria-label={t('account.details')}>
        <div className="account-drawer-bar">
          <p>{t('account.details')}</p>
          <button ref={closeRef} type="button" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
        <p className="account-drawer-name">{name}</p>
        <dl className="account-drawer-details">
          <div>
            <Mail size={16} aria-hidden />
            <div>
              <dt>{t('auth.email')}</dt>
              <dd dir="ltr">{user?.email || '—'}</dd>
            </div>
          </div>
          <div>
            <Phone size={16} aria-hidden />
            <div>
              <dt>{t('auth.phone')}</dt>
              <dd dir="ltr">{profile?.phone || '—'}</dd>
            </div>
          </div>
        </dl>
        <Link to="/account/orders" className="account-drawer-orders" onClick={onClose}>
          <Package size={16} aria-hidden />
          {t('account.orders')}
        </Link>
        <button
          type="button"
          className="account-drawer-logout"
          onClick={() => {
            onClose()
            void signOut()
          }}
        >
          <LogOut size={16} aria-hidden />
          {t('auth.logout')}
        </button>
      </aside>
    </div>
  )
}
