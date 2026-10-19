import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { useLocale } from '../../hooks/useLocale'
import { openWhatsAppChat } from '../../utils/whatsapp'
import WhatsAppIcon from '../common/WhatsAppIcon'

interface MobileMenuProps {
  open: boolean
  links: Array<{ to: string; label: string }>
  onClose: () => void
}

export default function MobileMenu({ open, links, onClose }: MobileMenuProps) {
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

  return (
    <div className="mobile-menu" role="dialog" aria-modal="true" aria-label={t('nav.mobileAria')}>
      <div className="mobile-menu-bar">
        <p>{t('nav.mainAria')}</p>
        <button ref={closeRef} type="button" onClick={onClose}>
          {t('common.closeMenu')}
        </button>
      </div>
      <nav aria-label={t('nav.mobileAria')}>
        {links.map((link) => (
          <Link key={link.to} to={link.to} onClick={onClose}>
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        className="mobile-menu-whatsapp"
        onClick={() => {
          onClose()
          openWhatsAppChat()
        }}
      >
        <WhatsAppIcon size={18} />
        {t('common.contactWhatsapp')}
      </button>
      <a href={`tel:${storeConfig.phone}`} dir="ltr">
        {storeConfig.phone}
      </a>
    </div>
  )
}
