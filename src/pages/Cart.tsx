import { MapPin, Phone, Plus, ShoppingBag, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type HTMLAttributes, type ReactNode } from 'react'
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
import { createOrderReference } from '../utils/orderReference'
import { validateCustomerForm } from '../utils/validation'
import { buildOrderPayload, buildWhatsAppOrderFileMessage, openWhatsApp } from '../utils/whatsapp'

export default function CartPage() {
  const { locale, t } = useLocale()
  usePageSeo(t('cart.seoTitle'), t('cart.seoDescription'))
  const { items } = useCart()
  const [customer, setCustomer] = useState<OrderCustomer>({
    name: '',
    phone: '',
    address: '',
    notes: '',
  })
  const [errors, setErrors] = useState<
    Partial<Record<'name' | 'phone' | 'address', string>>
  >({})
  const [orderDoc, setOrderDoc] = useState<{ reference: string; issuedAt: Date } | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const checkoutKey = JSON.stringify({
    customer,
    items: items.map((item) => [item.product.id, item.quantity, item.product.price]),
  })
  const checkoutKeyRef = useRef(checkoutKey)
  checkoutKeyRef.current = checkoutKey

  useEffect(() => {
    setOrderDoc(null)
    setPdfError('')
  }, [checkoutKey])

  if (items.length === 0) {
    return <EmptyCart />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateCustomerForm(customer, locale)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const issuedAt = orderDoc?.issuedAt ?? new Date()
    const reference = orderDoc?.reference ?? createOrderReference(issuedAt)
    const keyAtSubmit = checkoutKey
    setDownloading(true)
    setPdfError('')
    try {
      const { downloadOrderPdf } = await import('../utils/orderPdf')
      await downloadOrderPdf({
        payload: buildOrderPayload(customer, items, locale),
        reference,
        issuedAt,
        locale,
      })
      if (checkoutKeyRef.current === keyAtSubmit) setOrderDoc({ reference, issuedAt })
    } catch {
      setPdfError(
        locale === 'ar'
          ? 'تعذر إنشاء ملف الطلب. حاول مرة أخرى.'
          : 'The order file could not be created. Please try again.',
      )
    } finally {
      setDownloading(false)
    }
  }

  function openOrderWhatsApp() {
    if (!orderDoc) return
    const payload = buildOrderPayload(customer, items, locale)
    openWhatsApp(buildWhatsAppOrderFileMessage(orderDoc.reference, payload.total, locale))
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <ShoppingBag size={20} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {t('cart.title')}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('cart.subtitle')}</p>
        </div>
      </div>

      <p className="checkout-progress">
        {locale === 'ar'
          ? '01 مراجعة المنتجات ← 02 بيانات التوصيل ← 03 تنزيل الملخص ← 04 إرفاق الملف في واتساب'
          : '01 Review items → 02 Delivery details → 03 Download the summary → 04 Attach the file in WhatsApp'}
      </p>
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="overflow-hidden border border-mist bg-surface">
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
            noValidate
            onSubmit={onSubmit}
            className="space-y-3 border border-mist bg-surface p-4 sm:p-5"
          >
            <h2 className="font-display text-lg font-semibold">
              {t('cart.customerDetails')}
            </h2>

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

            <Button type="submit" size="lg" fullWidth disabled={downloading}>
              {downloading
                ? locale === 'ar'
                  ? 'جارٍ تجهيز الملف...'
                  : 'Preparing the file...'
                : locale === 'ar'
                  ? 'تنزيل ملخص الطلب'
                  : 'Download order summary'}
            </Button>
            {pdfError ? <p className="text-xs leading-6 text-danger">{pdfError}</p> : null}
            {orderDoc ? (
              <div className="space-y-3 border border-mist bg-paper p-3">
                <p className="text-sm leading-6">
                  {locale === 'ar'
                    ? `تم تنزيل ملخص الطلب ${orderDoc.reference}. افتح واتساب وأرفق الملف يدوياً من جهازك.`
                    : `Order summary ${orderDoc.reference} has downloaded. Open WhatsApp and attach the file yourself.`}
                </p>
                <p className="text-xs leading-5 text-muted">
                  {locale === 'ar'
                    ? 'رابط واتساب لا يرفق الملف تلقائياً، ولا يؤكد الطلب.'
                    : 'The WhatsApp link cannot attach the PDF automatically, and it does not confirm the order.'}
                </p>
                <Button
                  type="button"
                  size="lg"
                  fullWidth
                  className="bg-[#25D366] hover:bg-[#1ebe57]"
                  onClick={openOrderWhatsApp}
                >
                  <WhatsAppIcon size={18} />
                  {locale === 'ar' ? 'فتح واتساب' : 'Open WhatsApp'}
                </Button>
              </div>
            ) : (
              <p className="text-xs leading-6 text-muted">
                {locale === 'ar'
                  ? 'بعد التنزيل، أرفق ملف الملخص بنفسك في واتساب. السلة تبقى كما هي.'
                  : 'After the download, attach the summary yourself in WhatsApp. The cart stays as it is.'}
              </p>
            )}
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
