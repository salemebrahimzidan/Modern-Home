import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useLocale } from '../../hooks/useLocale'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  const { t } = useLocale()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label={t('common.closeDialog')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-surface p-5 shadow-soft"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-mist"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
