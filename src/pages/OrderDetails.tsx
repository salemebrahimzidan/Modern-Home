import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Clock,
  MapPin,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  UserRound,
  X,
} from 'lucide-react'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import Loading from '../components/common/Loading'
import { useLocale } from '../hooks/useLocale'
import type { Locale } from '../i18n/types'
import type { TranslationKey } from '../i18n/translations'
import { fetchOrder, submitVodafoneProof, type StoreOrder } from '../services/orders'
import { formatCurrency } from '../utils/currency'
import { isValidEgyptianPhone } from '../utils/validation'

const STEP_ICONS = {
  pending: ClipboardList,
  confirmed: Check,
  preparing: Settings,
  out_for_delivery: Truck,
  delivered: Package,
} as const

function formatWhen(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso))
}

function formatCount(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG').format(value)
}

function statusTone(status: string) {
  if (status === 'delivered') return 'bg-[#dcfce7] text-[#16a34a]'
  if (status === 'out_for_delivery') return 'bg-[#ede9fe] text-[#7c3aed]'
  if (status === 'preparing') return 'bg-[#ffedd5] text-[#ea580c]'
  if (status === 'confirmed') return 'bg-[#dbeafe] text-[#2563eb]'
  if (status === 'cancelled') return 'bg-[#ffe4e6] text-[#e11d48]'
  return 'bg-[#eef2f6] text-[#667085]'
}

function paymentTone(status: string | null) {
  if (status === 'paid') return 'bg-[#ecfdf3] text-[#16a34a]'
  if (status === 'rejected') return 'bg-[#ffe4e6] text-[#e11d48]'
  if (status === 'cancelled') return 'bg-[#f3f5f8] text-[#667085]'
  if (status === 'pending' || status === 'awaiting_verification') return 'bg-[#fff7ed] text-[#b45309]'
  return 'bg-[#eef2f6] text-[#344054]'
}

function paymentNote(
  order: StoreOrder,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
) {
  if (order.paymentStatus === 'cancelled') return t('account.paymentCancelled')
  if (order.paymentMethod === 'cod') {
    return order.paymentStatus === 'paid' ? t('account.paidOnDelivery') : t('account.payOnDelivery')
  }
  if (order.paymentStatus === 'paid') return t('account.vodafonePaid')
  if (order.paymentStatus === 'rejected') return t('account.vodafoneRejected')
  if (order.paymentStatus === 'awaiting_verification') return t('account.vodafoneReviewing')
  return t('account.vodafoneWaiting')
}

function EventIcon({ status }: { status: string }) {
  const Icon = STEP_ICONS[status as keyof typeof STEP_ICONS] ?? (status === 'cancelled' ? X : ClipboardList)
  return <Icon size={14} />
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="shrink-0 text-[#667085]">{label}</dt>
      <dd className="text-end font-medium text-[#121826]">{children}</dd>
    </div>
  )
}

export default function OrderDetails() {
  const { id } = useParams()
  const { locale, t } = useLocale()
  const [order, setOrder] = useState<StoreOrder | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [reference, setReference] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    void fetchOrder(id)
      .then((data) => {
        if (active) setOrder(data)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : t('checkout.failed'))
      })
    return () => {
      active = false
    }
  }, [id, t])

  async function sendProof(event: FormEvent) {
    event.preventDefault()
    if (!order) return
    if (!isValidEgyptianPhone(senderPhone) || reference.trim().length < 4) {
      setError(t('checkout.referenceRequired'))
      return
    }
    setError('')
    try {
      await submitVodafoneProof(order.id, senderPhone, reference)
      setNotice(t('account.proofSent'))
      const next = await fetchOrder(order.id)
      setOrder(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('checkout.failed'))
    }
  }

  if (error && !order) return <p className="mx-auto max-w-3xl px-4 py-10 text-danger">{error}</p>
  if (order === undefined) return <Loading label={t('common.loading')} />
  if (!order) {
    return <EmptyState title={t('product.notFoundTitle')} actionLabel={t('account.orders')} actionTo="/account/orders" />
  }

  const paymentKey = order.paymentMethod === 'vodafone_cash' ? 'checkout.vodafone' : 'checkout.cod'
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft
  const history = [...order.events].reverse()
  const itemsTotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0)

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link to="/account/orders" className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
        <BackIcon size={16} aria-hidden />
        {t('account.orders')}
      </Link>

      <div className="mt-6 border-b border-mist pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted">{t('account.reference')}</p>
            <h1 className="mt-1 break-all font-display text-3xl text-ink sm:text-4xl">{order.reference}</h1>
            <p className="mt-2 text-sm text-muted">
              <time dateTime={order.createdAt}>{formatWhen(order.createdAt, locale)}</time>
              {' · '}
              {t(paymentKey)}
            </p>
          </div>
          <div className="shrink-0 text-end">
            <p className="text-xs text-muted">{t('account.total')}</p>
            <p className="mt-1 font-display text-2xl text-ink">{formatCurrency(order.total, locale)}</p>
            <p className="mt-1 max-w-44 text-[11px] leading-4 text-muted">{t('account.shippingNote')}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(order.status)}`}>
            {t(`orderStatus.${order.status}` as TranslationKey)}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${paymentTone(order.paymentStatus)}`}>
            {paymentNote(order, t)}
          </span>
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7ebf0] bg-white shadow-sm">
        <div className="grid items-start lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 p-4 sm:p-5 lg:border-e lg:border-[#eef2f6]">
            <div className="border-b border-[#eef2f6] pb-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#c2410c]">
                <UserRound size={16} aria-hidden />
                {t('account.customer')}
              </h2>
              <dl className="mt-3 space-y-3">
                <InfoRow label={t('account.name')}>{order.recipientName}</InfoRow>
                <InfoRow label={t('auth.phone')}>
                  <a href={`tel:${order.recipientPhone}`} className="text-[#c2410c]" dir="ltr">
                    {order.recipientPhone}
                  </a>
                </InfoRow>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="inline-flex shrink-0 items-center gap-2 text-[#667085]">
                    <MapPin size={15} className="text-[#ea580c]" aria-hidden />
                    {t('account.address')}
                  </span>
                  <dd className="text-end font-medium text-[#121826]">
                    {order.street}
                    {locale === 'ar' ? '، ' : ', '}
                    {order.city}
                    {locale === 'ar' ? '، ' : ', '}
                    {order.governorate}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#121826]">
                <ShoppingCart size={16} aria-hidden />
                {t('account.items')}
              </h2>
              <div className="mt-4 overflow-x-auto rounded-xl border border-[#e7ebf0]">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#f3f5f8] text-xs text-[#667085]">
                      <th className="px-4 py-3 text-start font-medium">{t('account.items')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('product.size')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('product.color')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('account.piecePrice')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('account.qty')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('account.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 1 ? 'bg-[#f6f8fa]' : 'bg-white'}>
                        <td className="px-4 py-3 font-medium text-[#121826]">
                          {locale === 'ar' ? item.nameAr : item.nameEn}
                        </td>
                        <td className="px-4 py-3 text-[#344054]">{item.size || '—'}</td>
                        <td className="px-4 py-3 text-[#344054]">{item.color || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#344054]">{formatCurrency(item.unitPrice, locale)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#344054]">{formatCount(item.quantity, locale)}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-[#121826]">{formatCurrency(item.lineTotal, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <dl className="ms-auto mt-3 w-full max-w-xs space-y-2 text-sm">
                <div className="flex items-center justify-between gap-6 text-[#344054]">
                  <dt>{t('account.itemsTotal')}</dt>
                  <dd className="font-medium text-[#121826]">{formatCurrency(itemsTotal, locale)}</dd>
                </div>
                <div className="flex items-center justify-between gap-6 text-[#344054]">
                  <dt>{t('account.shipping')}</dt>
                  <dd className="text-end text-xs text-[#667085]">{t('account.shippingBy')}</dd>
                </div>
                <div className="flex items-center justify-between gap-6 rounded-xl bg-[#f0fdf4] px-3 py-2 text-base font-semibold text-[#15803d]">
                  <dt>{t('account.total')}</dt>
                  <dd>{formatCurrency(order.total, locale)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <aside className="border-t border-[#eef2f6] lg:border-t-0">
            <h2 className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#c2410c]">
              <Clock size={16} aria-hidden />
              {t('account.history')}
            </h2>
            {history.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted">{t('account.empty')}</p>
            ) : (
              <ol className="px-4 pb-4" aria-label={t('account.history')}>
                {history.map((event, index) => {
                  const stamp = formatStamp(event.createdAt)
                  const detailKey = `orderEvent.${event.toStatus}` as TranslationKey
                  const detail = event.message || t(detailKey)
                  return (
                    <li key={event.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
                      <span className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full ${statusTone(event.toStatus)}`}>
                        <EventIcon status={event.toStatus} />
                      </span>
                      {index < history.length - 1 ? (
                        <span aria-hidden className="absolute top-7 bottom-0 start-3.5 w-px bg-[#ffedd5]" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#121826]">
                          {t(`orderStatus.${event.toStatus}` as TranslationKey)}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#667085]">{detail}</p>
                      </div>
                      <time className="shrink-0 text-end text-[11px] leading-4 text-[#667085]" dateTime={event.createdAt} dir="ltr">
                        {stamp}
                      </time>
                    </li>
                  )
                })}
              </ol>
            )}
          </aside>
        </div>
      </section>

      {order.paymentMethod === 'vodafone_cash' && order.paymentStatus === 'awaiting_verification' ? (
        <form className="mt-4 space-y-3 border border-mist bg-surface px-5 py-5" onSubmit={(event) => void sendProof(event)}>
          <h2 className="font-display text-xl">{t('account.proof')}</h2>
          <input
            value={senderPhone}
            onChange={(event) => setSenderPhone(event.target.value)}
            placeholder={t('checkout.senderPhone')}
            className="w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder={t('checkout.reference')}
            className="w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          <p className="text-xs text-muted">{t('checkout.vodafoneNote')}</p>
          <Button type="submit">{t('account.proof')}</Button>
        </form>
      ) : null}
      {notice ? <p className="mt-3 text-sm text-success">{notice}</p> : null}
      {error && order ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  )
}
