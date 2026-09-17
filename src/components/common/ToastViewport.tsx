import { X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

export default function ToastViewport() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-soft',
            toast.type === 'error'
              ? 'bg-danger'
              : toast.type === 'info'
                ? 'bg-ink'
                : 'bg-success',
          ].join(' ')}
          role="status"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className="rounded p-1 hover:bg-white/10"
            aria-label="إغلاق الإشعار"
            onClick={() => dismissToast(toast.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
