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

  if (!open) return null

  return (
    <div className="border-t border-mist bg-surface px-4 py-4 xl:hidden">
      <nav className="flex flex-col gap-1" aria-label={t('nav.mobileAria')}>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={onClose}
            className="rounded-xl px-3 py-3 text-sm hover:bg-mist"
          >
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            onClose()
            openWhatsAppChat()
          }}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-3 text-sm font-medium text-white"
        >
          <WhatsAppIcon size={18} />
          {t('common.contactWhatsapp')}
        </button>
        <p className="mt-3 px-3 text-xs text-muted">{storeConfig.phone}</p>
      </nav>
    </div>
  )
}
