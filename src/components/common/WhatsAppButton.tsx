import { useLocale } from '../../hooks/useLocale'
import { openWhatsAppChat } from '../../utils/whatsapp'
import Button from './Button'
import WhatsAppIcon from './WhatsAppIcon'

interface WhatsAppButtonProps {
  label?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

export default function WhatsAppButton({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: WhatsAppButtonProps) {
  const { t } = useLocale()
  const buttonLabel = label ?? t('common.contactWhatsapp')

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
      onClick={() => openWhatsAppChat()}
      aria-label={buttonLabel}
    >
      <WhatsAppIcon size={18} />
      {buttonLabel}
    </Button>
  )
}

export function FloatingWhatsAppButton() {
  const { t } = useLocale()
  const label = t('common.contactWhatsappLong')

  return (
    <button
      type="button"
      onClick={() => openWhatsAppChat()}
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] start-[max(1.25rem,env(safe-area-inset-inline-start))] z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:bottom-6 sm:start-6 sm:h-14 sm:w-14"
      aria-label={label}
    >
      <WhatsAppIcon size={26} />
    </button>
  )
}
