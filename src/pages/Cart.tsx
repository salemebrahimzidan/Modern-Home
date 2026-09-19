import { MapPin, Phone, Plus, ShoppingBag, UserRound } from 'lucide-react'
import { useState, type FormEvent, type HTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import CartItem from '../components/cart/CartItem'
import CartSummary from '../components/cart/CartSummary'
import EmptyCart from '../components/cart/EmptyCart'
import Button from '../components/common/Button'
import WhatsAppIcon from '../components/common/WhatsAppIcon'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import type { OrderCustomer } from '../types/order'
import { validateCustomerForm } from '../utils/validation'
import { buildOrderPayload, buildWhatsAppOrderMessage, openWhatsApp } from '../utils/whatsapp'

export default function CartPage() {
  const { locale, t } = useLocale()
  usePageSeo(t('cart.seoTitle'), t('cart.seoDescription'))
  const { items, clearCart } = useCart()
  const [customer, setCustomer] = useState<OrderCustomer>({
    name: '',
    phone: '',
    address: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<'name' | 'phone' | 'address', string>>>({})

  if (items.length === 0) {
    return <EmptyCart />
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateCustomerForm(customer, locale)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = buildOrderPayload(customer, items, locale)
    const message = buildWhatsAppOrderMessage(payload, locale)
    openWhatsApp(message)
    clearCart()
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <ShoppingBag size={20} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{t('cart.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('cart.subtitle')}</p>
        </div>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card">
          <ul className="px-4 sm:px-5">
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </ul>

          <div className="border-t border-mist/70 bg-paper/80 px-4 py-3 sm:px-5">
            <Link to="/products" className="block">
              <Button type="button" variant="primary" fullWidth>
                <Plus size={16} />
                {t('cart.addOtherProduct')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4 md:sticky md:top-24">
          <CartSummary />

          <form
            onSubmit={onSubmit}
            className="space-y-3 rounded-2xl border border-mist/70 bg-surface p-4 shadow-card sm:p-5"
          >
            <h2 className="font-display text-lg font-semibold">{t('cart.customerDetails')}</h2>

            <Field
              label={t('cart.fullName')}
              icon={<UserRound size={16} />}
              error={errors.name}
              value={customer.name}
              onChange={(value) => setCustomer((c) => ({ ...c, name: value }))}
              required
            />
            <Field
              label={t('cart.phone')}
              icon={<Phone size={16} />}
              error={errors.phone}
              value={customer.phone}
              onChange={(value) => setCustomer((c) => ({ ...c, phone: value }))}
              required
              inputMode="tel"
            />
            <Field
              label={t('cart.address')}
              icon={<MapPin size={16} />}
              error={errors.address}
              value={customer.address}
              onChange={(value) => setCustomer((c) => ({ ...c, address: value }))}
              required
            />
            <label className="block text-sm">
              {t('cart.notes')}
              <textarea
                value={customer.notes ?? ''}
                onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </label>

            <Button
              type="submit"
              size="lg"
              fullWidth
              className="bg-[#25D366] hover:bg-[#1ebe57]"
            >
              <WhatsAppIcon size={18} />
              {t('cart.sendWhatsapp')}
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  icon,
  value,
  onChange,
  error,
  required,
  inputMode,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label className="block text-sm">
      {label}
      <span className="relative mt-1 block">
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted">
          {icon}
        </span>
        <input
          required={required}
          value={value}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          className={[
            'w-full rounded-xl border bg-paper py-2.5 ps-10 pe-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
            error ? 'border-danger' : 'border-mist',
          ].join(' ')}
        />
      </span>
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  )
}
