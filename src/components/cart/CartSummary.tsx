import { useCart } from '../../hooks/useCart'
import { useLocale } from '../../hooks/useLocale'
import { formatCurrency } from '../../utils/currency'

export default function CartSummary() {
  const { getCartItemsCount, getCartTotal } = useCart()
  const { locale, t } = useLocale()
  const count = getCartItemsCount()
  const total = getCartTotal()

  return (
    <div className="rounded-2xl border border-mist/70 bg-surface p-5 shadow-card">
      <h2 className="font-display text-xl font-semibold">{t('cart.summary')}</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">{t('cart.itemCount')}</dt>
          <dd className="font-medium">{count}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{t('cart.subtotal')}</dt>
          <dd className="font-medium">{formatCurrency(total, locale)}</dd>
        </div>
        <div className="flex justify-between border-t border-mist pt-3 text-base">
          <dt className="font-semibold">{t('cart.total')}</dt>
          <dd className="font-bold text-accent">{formatCurrency(total, locale)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-6 text-muted">{t('cart.noOnlinePayment')}</p>
    </div>
  )
}
