import { MessageCircle } from 'lucide-react'
import { useState, type FormEvent, type HTMLAttributes } from 'react'
import CartItem from '../components/cart/CartItem'
import CartSummary from '../components/cart/CartSummary'
import EmptyCart from '../components/cart/EmptyCart'
import Button from '../components/common/Button'
import { useCart } from '../hooks/useCart'
import { usePageSeo } from '../hooks/usePageSeo'
import type { OrderCustomer } from '../types/order'
import { validateCustomerForm } from '../utils/validation'
import {
  buildOrderPayload,
  buildWhatsAppOrderMessage,
  openWhatsApp,
} from '../utils/whatsapp'

export default function CartPage() {
  usePageSeo('السلة', 'راجع منتجاتك وأرسل الطلب عبر واتساب.')
  const { items, clearCart } = useCart()
  const [customer, setCustomer] = useState<OrderCustomer>({
    name: '',
    phone: '',
    address: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<'name' | 'phone' | 'address', string>>>(
    {},
  )

  if (items.length === 0) {
    return <EmptyCart />
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateCustomerForm(customer)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = buildOrderPayload(customer, items)
    const message = buildWhatsAppOrderMessage(payload)
    openWhatsApp(message)
    clearCart()
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">سلة التسوق</h1>
      <p className="mt-2 text-muted">راجع طلبك ثم أرسله للمتجر عبر واتساب.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-mist/70 bg-surface px-4 shadow-card sm:px-5">
          <ul>
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          <CartSummary />

          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-mist/70 bg-surface p-5 shadow-card"
          >
            <h2 className="font-display text-xl font-semibold">بيانات العميل</h2>

            <Field
              label="الاسم الكامل"
              error={errors.name}
              value={customer.name}
              onChange={(value) => setCustomer((c) => ({ ...c, name: value }))}
              required
            />
            <Field
              label="رقم الهاتف"
              error={errors.phone}
              value={customer.phone}
              onChange={(value) => setCustomer((c) => ({ ...c, phone: value }))}
              required
              inputMode="tel"
            />
            <Field
              label="العنوان"
              error={errors.address}
              value={customer.address}
              onChange={(value) => setCustomer((c) => ({ ...c, address: value }))}
              required
            />
            <label className="block text-sm">
              ملاحظات (اختياري)
              <textarea
                value={customer.notes ?? ''}
                onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 outline-none focus:border-accent"
              />
            </label>

            <Button type="submit" size="lg" fullWidth>
              <MessageCircle size={18} />
              إرسال الطلب عبر واتساب
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        required={required}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'mt-1 w-full rounded-xl border bg-paper px-3 py-2.5 outline-none focus:border-accent',
          error ? 'border-danger' : 'border-mist',
        ].join(' ')}
      />
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  )
}
