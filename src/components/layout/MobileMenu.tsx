import { Link } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { openWhatsAppChat } from '../../utils/whatsapp'

interface MobileMenuProps {
  open: boolean
  links: Array<{ to: string; label: string }>
  onClose: () => void
}

export default function MobileMenu({ open, links, onClose }: MobileMenuProps) {
  if (!open) return null

  return (
    <div className="border-t border-mist bg-surface px-4 py-4 lg:hidden">
      <nav className="flex flex-col gap-1" aria-label="قائمة الجوال">
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
          className="mt-2 rounded-xl bg-[#25D366] px-3 py-3 text-sm font-medium text-white"
        >
          تواصل عبر واتساب
        </button>
        <p className="mt-3 px-3 text-xs text-muted">{storeConfig.phone}</p>
      </nav>
    </div>
  )
}
