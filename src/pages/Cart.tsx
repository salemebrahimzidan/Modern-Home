import { MapPin, Phone, User } from 'lucide-react'
import { useRef, useState, type FormEvent, type HTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CartItem from '../components/cart/CartItem'
import CartSummary from '../components/cart/CartSummary'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import { createAddress, placeOrder, submitVodafoneProof, type StorePaymentMethod } from '../services/orders'
import { isValidEgyptianPhone } from '../utils/validation'

interface CheckoutForm {
  recipientName: string
  phone: string
  governorate: string
  city: string
  street: string
  notes: string
  method: StorePaymentMethod
  senderPhone: string
  transferReference: string
}

const emptyForm: CheckoutForm = {
  recipientName: '',
  phone: '',
  governorate: '',
  city: '',
  street: '',
  notes: '',
  method: 'cod',
  senderPhone: '',
  transferReference: '',
}

export default function Cart() {
  const { items, clearCart } = useCart()
  const { t } = useLocale()
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<CheckoutForm>({
    ...emptyForm,
    recipientName: profile?.fullName ?? '',
    phone: profile?.phone ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const idempotencyKey = useRef(crypto.randomUUID())

  const set = (key: keyof CheckoutForm) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!session) return
    const next: Partial<Record<keyof CheckoutForm, string>> = {}
    if (!form.recipientName.trim()) next.recipientName = t('validation.nameRequired')
    if (!form.phone.trim()) next.phone = t('validation.phoneRequired')
    else if (!isValidEgyptianPhone(form.phone)) next.phone = t('validation.phoneInvalid')
    if (!form.governorate.trim() || !form.city.trim() || !form.street.trim()) {
      next.street = t('validation.addressRequired')
    }
    if (form.method === 'vodafone_cash') {
      if (!isValidEgyptianPhone(form.senderPhone)) next.senderPhone = t('validation.phoneInvalid')
      if (form.transferReference.trim().length < 4) {
        next.transferReference = t('checkout.referenceRequired')
      }
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    setMessage('')
    try {
      const addressId = await createAddress(session.user.id, form)
      const orderId = await placeOrder({
        addressId,
        method: form.method,
        idempotencyKey: idempotencyKey.current,
        note: form.notes,
      })
      if (form.method === 'vodafone_cash') {
        await submitVodafoneProof(orderId, form.senderPhone, form.transferReference)
      }
      clearCart()
      navigate(`/account/orders/${orderId}`)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : t('checkout.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="mb-8 font-display text-3xl text-ink md:text-4xl">{t('cart.title')}</h1>

      {items.length === 0 ? (
        <EmptyState title={t('cart.emptyTitle')} description={t('cart.emptyDescription')} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <CartItem key={item.variantId} item={item} />
            ))}
          </div>
          <div className="h-fit space-y-4 rounded-3xl border border-mist bg-surface p-5 lg:sticky lg:top-24">
            <CartSummary />
            {session ? (
              <form className="space-y-3" onSubmit={(event) => void submit(event)}>
                <h2 className="font-display text-xl text-ink">{t('cart.customerDetails')}</h2>
                <Field
                  label={t('cart.fullName')}
                  icon={<User className="h-4 w-4" />}
                  value={form.recipientName}
                  onChange={set('recipientName')}
                  error={errors.recipientName}
                />
                <Field
                  label={t('cart.phone')}
                  icon={<Phone className="h-4 w-4" />}
                  value={form.phone}
                  onChange={set('phone')}
                  error={errors.phone}
                  inputMode="tel"
                />
                <Field
                  label={t('checkout.governorate')}
                  icon={<MapPin className="h-4 w-4" />}
                  value={form.governorate}
                  onChange={set('governorate')}
                />
                <Field
                  label={t('checkout.city')}
                  icon={<MapPin className="h-4 w-4" />}
                  value={form.city}
                  onChange={set('city')}
                />
                <Field
                  label={t('cart.address')}
                  icon={<MapPin className="h-4 w-4" />}
                  value={form.street}
                  onChange={set('street')}
                  error={errors.street}
                />
                <label className="block text-sm">
                  {t('cart.notes')}
                  <textarea
                    value={form.notes}
                    onChange={(event) => set('notes')(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                    rows={2}
                  />
                </label>
                <fieldset className="space-y-2 text-sm">
                  <legend className="mb-1 font-medium text-ink">{t('checkout.method')}</legend>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.method === 'cod'}
                      onChange={() => set('method')('cod')}
                    />
                    {t('checkout.cod')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.method === 'vodafone_cash'}
                      onChange={() => set('method')('vodafone_cash')}
                    />
                    {t('checkout.vodafone')}
                  </label>
                </fieldset>
                {form.method === 'vodafone_cash' ? (
                  <>
                    <Field
                      label={t('checkout.senderPhone')}
                      icon={<Phone className="h-4 w-4" />}
                      value={form.senderPhone}
                      onChange={set('senderPhone')}
                      error={errors.senderPhone}
                      inputMode="tel"
                    />
                    <Field
                      label={t('checkout.reference')}
                      icon={<MapPin className="h-4 w-4" />}
                      value={form.transferReference}
                      onChange={set('transferReference')}
                      error={errors.transferReference}
                    />
                    <p className="text-xs leading-6 text-muted">{t('checkout.vodafoneNote')}</p>
                  </>
                ) : null}
                {message ? <p className="text-sm text-danger">{message}</p> : null}
                <Button type="submit" fullWidth disabled={submitting}>
                  {submitting ? t('checkout.placing') : t('checkout.place')}
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-muted">{t('checkout.signInRequired')}</p>
                <Link to="/login" state={{ from: '/cart' }}>
                  <Button fullWidth>{t('auth.login')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function Field({
  label,
  icon,
  value,
  onChange,
  error,
  inputMode,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  error?: string
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
          value={value}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
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
