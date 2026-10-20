import { Coins, ShoppingCart } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useLocale } from '../../hooks/useLocale'
import { formatCurrency } from '../../utils/currency'

export default function CartSummary({ embedded = false }: { embedded?: boolean }) {
  const { getCartItemsCount, getCartTotal } = useCart()
  const { locale, t } = useLocale()
  const count = getCartItemsCount()
  const total = getCartTotal()

  return (
    <div className={embedded ? undefined : 'overflow-hidden rounded-2xl border border-[#e7ebf0] bg-white shadow-sm'}>
      <div className="flex items-center gap-2 bg-[#eef8f1] px-4 py-3 text-[#178a45]">
        <ShoppingCart size={18} aria-hidden />
        <h2 className="text-sm font-semibold">{t('cart.summary')}</h2>
      </div>
      <dl className="space-y-3 px-4 py-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#667085]">{t('cart.itemCount')}</dt>
          <dd className="font-semibold text-[#121826]">{count}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#667085]">{t('cart.productsTotal')}</dt>
          <dd className="font-semibold text-[#121826]">{formatCurrency(total, locale)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#e7ebf0] pb-3">
          <dt className="text-[#667085]">{t('cart.shippingCost')}</dt>
          <dd className="text-xs text-[#667085]">{t('account.shippingBy')}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-[#eef8f1] px-3 py-3 text-[#178a45]">
          <dt className="flex items-center gap-2 font-semibold">
            <Coins size={16} aria-hidden />
            {t('cart.grandTotal')}
          </dt>
          <dd className="text-lg font-bold">{formatCurrency(total, locale)}</dd>
        </div>
      </dl>
    </div>
  )
}
