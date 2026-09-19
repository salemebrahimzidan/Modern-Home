import { ReceiptText } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useLocale } from '../../hooks/useLocale'
import { formatCurrency } from '../../utils/currency'

export default function CartSummary() {
  const { getCartItemsCount, getCartTotal } = useCart()
  const { locale, t } = useLocale()
  const count = getCartItemsCount()
  const total = getCartTotal()

  return (
    <aside className="overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <ReceiptText size={17} />
        </span>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            {t('cart.summary')}
          </p>
          <h2 className="font-display text-base font-semibold leading-tight">
            {t('cart.itemCount')} · {count}
          </h2>
        </div>
      </div>

      <div className="mx-5 border-t border-dashed border-mist" />

      <div className="px-5 py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          {t('cart.total')}
        </p>
        <p className="mt-1 font-display text-[1.65rem] font-bold leading-none tracking-tight text-accent">
          {formatCurrency(total, locale)}
        </p>
      </div>

      <p className="border-t border-mist/70 bg-paper/80 px-5 py-3 text-[11px] leading-5 text-muted">
        {t('cart.noOnlinePayment')}
      </p>
    </aside>
  )
}
