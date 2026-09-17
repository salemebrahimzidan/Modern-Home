import { useCart } from '../../hooks/useCart'
import { formatCurrency } from '../../utils/currency'

export default function CartSummary() {
  const { getCartItemsCount, getCartTotal } = useCart()
  const count = getCartItemsCount()
  const total = getCartTotal()

  return (
    <div className="rounded-2xl border border-mist/70 bg-surface p-5 shadow-card">
      <h2 className="font-display text-xl font-semibold">ملخص الطلب</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">عدد المنتجات</dt>
          <dd className="font-medium">{count}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">المجموع الفرعي</dt>
          <dd className="font-medium">{formatCurrency(total)}</dd>
        </div>
        <div className="flex justify-between border-t border-mist pt-3 text-base">
          <dt className="font-semibold">الإجمالي</dt>
          <dd className="font-bold text-accent">{formatCurrency(total)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-6 text-muted">
        لا يوجد دفع إلكتروني حالياً. يتم إرسال الطلب عبر واتساب لإتمام الشراء مع المتجر.
      </p>
    </div>
  )
}
