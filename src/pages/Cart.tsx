import { Banknote, Check, ChevronDown, ClipboardList, Home, MapPin, Phone, Smartphone, StickyNote, Trash2, User } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type HTMLAttributes, type ReactNode } from 'react'
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

const GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'البحر الأحمر',
  'البحيرة',
  'الفيوم',
  'الغربية',
  'الإسماعيلية',
  'المنوفية',
  'المنيا',
  'القليوبية',
  'الوادي الجديد',
  'السويس',
  'أسوان',
  'أسيوط',
  'بني سويف',
  'بورسعيد',
  'دمياط',
  'الشرقية',
  'جنوب سيناء',
  'كفر الشيخ',
  'مطروح',
  'الأقصر',
  'قنا',
  'شمال سيناء',
  'سوهاج',
]

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
  const [form, setForm] = useState<CheckoutForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({})

  useEffect(() => {
    const meta = session?.user.user_metadata
    const name = profile?.fullName || (typeof meta?.full_name === 'string' ? meta.full_name : '')
    const phone = profile?.phone || (typeof meta?.phone === 'string' ? meta.phone : '')
    if (!name && !phone) return
    setForm((current) => ({
      ...current,
      recipientName: current.recipientName || name,
      phone: current.phone || phone,
    }))
  }, [profile, session])
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
    <section className="bg-[#f4f7fb]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-5 flex items-center gap-2 text-2xl font-semibold text-[#121826]">
        <ClipboardList size={22} className="text-[#178a45]" aria-hidden />
        {t('cart.orderDetails')}
      </h1>

      {items.length === 0 ? (
        <EmptyState title={t('cart.emptyTitle')} description={t('cart.emptyDescription')} />
      ) : (
        <div className="space-y-8">
          <div className="overflow-x-auto rounded-xl border border-[#e7ebf0] bg-white">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f3f5f8] text-xs text-[#667085]">
                  <th className="px-4 py-3 text-start font-medium">{t('account.items')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('product.size')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('product.color')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('account.piecePrice')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('account.qty')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('account.total')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('cart.action')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <CartItem key={item.variantId} item={item} />
                ))}
              </tbody>
            </table>
          </div>
          {session ? (
            <form className="space-y-4" onSubmit={(event) => void submit(event)}>
              <section className="rounded-2xl border border-[#e7ebf0] bg-white shadow-sm">
                <div className="grid items-start lg:grid-cols-3">
              <div className="lg:border-e lg:border-[#eef2f6]">
              <Panel title={t('account.address')} icon={<MapPin size={18} />} tone="green" plain>
                <SelectField
                  label={t('checkout.governorate')}
                  icon={<MapPin className="h-4 w-4" />}
                  value={form.governorate}
                  onChange={set('governorate')}
                  placeholder={t('cart.chooseGovernorate')}
                  options={GOVERNORATES}
                />
                <Field
                  label={t('checkout.city')}
                  icon={<MapPin className="h-4 w-4" />}
                  value={form.city}
                  onChange={set('city')}
                  placeholder={t('cart.chooseCity')}
                />
                <Field
                  label={t('cart.detailedAddress')}
                  icon={<Home className="h-4 w-4" />}
                  value={form.street}
                  onChange={set('street')}
                  error={errors.street}
                  placeholder={t('cart.addressPlaceholder')}
                />
                <AreaField
                  label={t('cart.notes')}
                  icon={<StickyNote className="h-4 w-4" />}
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder={t('cart.notesPlaceholder')}
                />
              </Panel>
              </div>

              <div className="lg:border-e lg:border-[#eef2f6]">
                <Panel title={t('cart.customerDetails')} icon={<User size={18} />} tone="blue" plain>
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
                </Panel>
                <Panel title={t('checkout.method')} icon={<Banknote size={18} />} tone="amber" plain>
                  <PayOption
                    checked={form.method === 'cod'}
                    label={t('checkout.cod')}
                    icon={<Banknote size={16} />}
                    onChange={() => set('method')('cod')}
                  />
                  <PayOption
                    checked={form.method === 'vodafone_cash'}
                    label={t('checkout.vodafone')}
                    icon={<Smartphone size={16} />}
                    onChange={() => set('method')('vodafone_cash')}
                  />
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
                        icon={<StickyNote className="h-4 w-4" />}
                        value={form.transferReference}
                        onChange={set('transferReference')}
                        error={errors.transferReference}
                      />
                      <p className="text-xs leading-6 text-[#667085]">{t('checkout.vodafoneNote')}</p>
                    </>
                  ) : null}
                </Panel>
              </div>

              <CartSummary embedded />
                </div>
              </section>

              <Panel title={t('cart.orderNotes')} icon={<StickyNote size={18} />} tone="green">
                <AreaField
                  label={t('cart.orderNotes')}
                  icon={<StickyNote className="h-4 w-4" />}
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder={t('cart.orderNotesPlaceholder')}
                  hideLabel
                />
              </Panel>

              {message ? <p className="text-sm text-danger">{message}</p> : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#178a45] px-5 py-3 text-sm font-medium text-white hover:bg-[#146c37] disabled:opacity-60"
                >
                  <Check size={16} aria-hidden />
                  {submitting ? t('checkout.placing') : t('checkout.place')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#fff1f2] px-5 py-3 text-sm font-medium text-[#e11d48] hover:bg-[#ffe4e6]"
                >
                  <Trash2 size={16} aria-hidden />
                  {t('cart.cancelOrder')}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-3">
              <CartSummary />
              <div className="space-y-3 rounded-2xl border border-[#e7ebf0] bg-white p-5 shadow-sm lg:col-span-2">
                <p className="text-sm leading-6 text-[#667085]">{t('checkout.signInRequired')}</p>
                <Link to="/login" state={{ from: '/cart' }}>
                  <Button fullWidth>{t('auth.login')}</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </section>
  )
}

function Panel({
  title,
  icon,
  tone,
  className = '',
  plain = false,
  children,
}: {
  title: string
  icon: ReactNode
  tone: 'green' | 'blue' | 'amber'
  className?: string
  plain?: boolean
  children: ReactNode
}) {
  const tones = {
    green: 'bg-[#eef8f1] text-[#178a45]',
    blue: 'bg-[#eef5ff] text-[#2563eb]',
    amber: 'bg-[#fff8eb] text-[#b45309]',
  }
  return (
    <section className={plain ? className : `relative rounded-2xl border border-[#e7ebf0] bg-white shadow-sm ${className}`}>
      <div className={`flex items-center gap-2 px-4 py-3 ${plain ? '' : 'rounded-t-2xl'} ${tones[tone]}`}>
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  )
}

function PayOption({
  checked,
  label,
  icon,
  onChange,
}: {
  checked: boolean
  label: string
  icon: ReactNode
  onChange: () => void
}) {
  return (
    <label
      className={[
        'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm transition',
        checked ? 'border-[#86efac] bg-[#f0fdf4] text-[#121826]' : 'border-[#e7ebf0] bg-white text-[#344054]',
      ].join(' ')}
    >
      <span className="flex items-center gap-2 font-medium">
        {icon}
        {label}
      </span>
      <input
        type="radio"
        name="payment-method"
        className="size-4 accent-[#178a45]"
        checked={checked}
        onChange={onChange}
      />
    </label>
  )
}

const fieldClass =
  'w-full rounded-xl border bg-white py-2.5 ps-10 pe-3 text-sm text-[#121826] outline-none focus:border-[#178a45] focus:ring-2 focus:ring-[#178a45]/15'

function Field({
  label,
  icon,
  value,
  onChange,
  error,
  inputMode,
  placeholder,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  error?: string
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
}) {
  return (
    <label className="block text-xs font-medium text-[#667085]">
      {label}
      <span className="relative mt-1 block">
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#98a2b3]">{icon}</span>
        <input
          value={value}
          inputMode={inputMode}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={[fieldClass, error ? 'border-danger' : 'border-[#e7ebf0]'].join(' ')}
        />
      </span>
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  )
}

function SelectField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: string[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const menuId = useId()
  const visible = options.filter((option) => option.includes(query.trim()))

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative text-xs font-medium text-[#667085] ${open ? 'z-30' : ''}`}>
      <span>{label}</span>
      <button
        type="button"
        className="mt-1 flex w-full items-center gap-2 rounded-xl border border-[#e7ebf0] bg-white px-3 py-2.5 text-start text-sm outline-none focus:border-[#178a45] focus:ring-2 focus:ring-[#178a45]/15"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() =>
          setOpen((current) => {
            if (current) return false
            setQuery('')
            return true
          })
        }
      >
        <span className="text-[#98a2b3]">{icon}</span>
        <span className={`min-w-0 flex-1 truncate ${value ? 'text-[#121826]' : 'text-[#98a2b3]'}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-[#98a2b3] transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div id={menuId} role="listbox" aria-label={label} className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[#e7ebf0] bg-white shadow-lg">
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={label}
            className="w-full border-b border-[#eef2f6] px-3 py-2.5 text-sm text-[#121826] outline-none"
          />
          <ul className="max-h-52 overflow-auto py-1">
            {visible.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[#98a2b3]">{placeholder}</li>
            ) : (
              visible.map((option) => {
                const selected = option === value
                return (
                  <li key={option}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm ${
                        selected ? 'bg-[#eef8f1] font-medium text-[#178a45]' : 'text-[#121826] hover:bg-[#f4f7fb]'
                      }`}
                      onClick={() => {
                        onChange(option)
                        setOpen(false)
                      }}
                    >
                      <span>{option}</span>
                      {selected ? <Check size={14} /> : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function AreaField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  hideLabel = false,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder: string
  hideLabel?: boolean
}) {
  return (
    <label className="block text-xs font-medium text-[#667085]">
      {hideLabel ? <span className="sr-only">{label}</span> : label}
      <span className="relative mt-1 block">
        <span className="pointer-events-none absolute start-3 top-3 text-[#98a2b3]">{icon}</span>
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          className={`${fieldClass} border-[#e7ebf0] py-2.5`}
        />
      </span>
    </label>
  )
}
