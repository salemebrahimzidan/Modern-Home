import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { storeConfig } from '../../config/store'
import { localized } from '../../i18n/types'
import { useLocale } from '../../hooks/useLocale'

interface MobileMenuProps {
  open: boolean
  links: Array<{ to: string; label: string }>
  onClose: () => void
}

export default function MobileMenu({ open, links, onClose }: MobileMenuProps) {
  const { locale, t } = useLocale()
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

  return createPortal(
    <div className="mobile-menu-root">
      <button type="button" className="mobile-menu-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div className="mobile-menu" role="dialog" aria-modal="true" aria-label={t('nav.mobileAria')}>
        <div className="mobile-menu-bar">
          <div>
            <span className="store-wordmark">
              {storeConfig.name}
              <small>KITCHEN &amp; LIVING</small>
            </span>
            <p className="mobile-menu-tagline">{localized(storeConfig.tagline, locale)}</p>
          </div>
          <button ref={closeRef} type="button" className="mobile-menu-close" aria-label={t('common.closeMenu')} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <nav aria-label={t('nav.mobileAria')}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/account/orders'}
              onClick={onClose}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>,
    document.body,
  )
}
