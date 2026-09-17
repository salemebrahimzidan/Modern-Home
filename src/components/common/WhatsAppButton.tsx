import { MessageCircle } from 'lucide-react'
import { openWhatsAppChat } from '../../utils/whatsapp'
import Button from './Button'

interface WhatsAppButtonProps {
  label?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

export default function WhatsAppButton({
  label = 'تواصل عبر واتساب',
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: WhatsAppButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
      onClick={() => openWhatsAppChat()}
      aria-label={label}
    >
      <MessageCircle size={18} />
      {label}
    </Button>
  )
}

export function FloatingWhatsAppButton() {
  return (
    <button
      type="button"
      onClick={() => openWhatsAppChat()}
      className="fixed bottom-5 start-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:bottom-6 sm:start-6"
      aria-label="تواصل معنا عبر واتساب"
    >
      <MessageCircle size={26} />
    </button>
  )
}
