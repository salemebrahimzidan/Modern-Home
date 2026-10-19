import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, MapPin } from 'lucide-react'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import Loading from '../components/common/Loading'
import { useLocale } from '../hooks/useLocale'
import type { Locale } from '../i18n/types'
import type { TranslationKey } from '../i18n/translations'
import { fetchOrder, submitVodafoneProof, type StoreOrder, type StoreOrderEvent } from '../services/orders'
import { formatCurrency } from '../utils/currency'
import { isValidEgyptianPhone } from '../utils/validation'

const TRACK_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const

function formatWhen(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatCount(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG').format(value)
}

function statusTone(status: string) {
  if (status === 'delivered') return 'bg-success/10 text-success'
  if (status === 'cancelled') return 'bg-danger/10 text-danger'
  if (status === 'pending') return 'bg-warn/15 text-warn'
  return 'bg-accent-soft text-accent'
}

function paymentTone(status: string | null) {
  if (status === 'paid') return 'bg-success/10 text-success'
  if (status === 'rejected' || status === 'cancelled') return 'bg-danger/10 text-danger'
  if (status === 'awaiting_verification') return 'bg-warn/15 text-warn'
  return 'bg-mist text-ink'
}

function stepMarkClass(step: string, reached: boolean, current: boolean, cancelled: boolean) {
  const base = 'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2'
  if (reached && !current) {
    if (cancelled && step === 'cancelled') return `${base} border-danger bg-danger text-white`
    return `${base} border-accent bg-accent text-white`
  }
  if (current) {
    if (cancelled) return `${base} border-danger bg-paper text-danger`
    return `${base} border-accent bg-paper text-accent`
  }
  return `${base} border-mist bg-paper text-mist`
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

  const cancelled = order.status === 'cancelled'
  const steps = cancelled
    ? [...TRACK_STEPS.filter((step) => order.events.some((event) => event.toStatus === step)), 'cancelled']
    : [...TRACK_STEPS]
  const currentIndex = cancelled
    ? steps.length - 1
    : Math.max(TRACK_STEPS.indexOf(order.status as (typeof TRACK_STEPS)[number]), 0)
  const eventByStatus = new Map<string, StoreOrderEvent>()
  for (const event of order.events) eventByStatus.set(event.toStatus, event)
  const stepViews = steps.map((step, index) => ({
    step,
    event: eventByStatus.get(step),
    reached: index <= currentIndex,
    current: index === currentIndex && step !== 'delivered',
    isLast: index === steps.length - 1,
    lineDone: index < currentIndex,
  }))
  const paymentKey = order.paymentMethod === 'vodafone_cash' ? 'checkout.vodafone' : 'checkout.cod'
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft
  const lineClass = cancelled ? 'bg-danger' : 'bg-accent'

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
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
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(order.status)}`}>
            {t(`orderStatus.${order.status}` as TranslationKey)}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${paymentTone(order.paymentStatus)}`}>
            {t('account.payment')}:{' '}
            {order.paymentStatus ? t(`paymentStatus.${order.paymentStatus}` as TranslationKey) : '—'}
          </span>
        </div>
      </div>

      <div className="mt-6 border border-mist bg-surface px-5 py-5 sm:px-6">
        <h2 className="font-display text-xl text-ink">{t('account.progress')}</h2>
        <ol
          className="mt-6 hidden sm:grid"
          style={{ gridTemplateColumns: `repeat(${stepViews.length}, minmax(0, 1fr))` }}
          aria-label={t('account.progress')}
        >
          {stepViews.map((view) => (
            <li key={view.step} className="min-w-0">
              <div className="flex items-center">
                <span className={stepMarkClass(view.step, view.reached, view.current, cancelled)}>
                  {view.reached && !view.current ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <span className="size-2 rounded-full bg-current" />
                  )}
                </span>
                {view.isLast ? null : (
                  <span aria-hidden className={`mx-2 h-0.5 min-w-2 flex-1 ${view.lineDone ? lineClass : 'bg-mist'}`} />
                )}
              </div>
              <p className={`mt-3 pe-3 text-xs leading-5 ${view.reached ? 'font-medium text-ink' : 'text-muted'}`}>
                {t(`orderStatus.${view.step}` as TranslationKey)}
              </p>
              {view.event ? (
                <time className="mt-1 block pe-3 text-[11px] leading-4 text-muted" dateTime={view.event.createdAt}>
                  {formatWhen(view.event.createdAt, locale)}
                </time>
              ) : null}
              {view.event?.message ? (
                <p className="mt-1 pe-3 text-xs leading-5 text-muted">{view.event.message}</p>
              ) : null}
            </li>
          ))}
        </ol>

        <ol className="mt-5 sm:hidden" aria-label={t('account.progress')}>
          {stepViews.map((view) => (
            <li key={view.step} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4">
              <div className="relative flex justify-center">
                {view.isLast ? null : (
                  <span
                    aria-hidden
                    className={`absolute top-3.5 bottom-0 w-0.5 ${view.lineDone ? lineClass : 'bg-mist'}`}
                  />
                )}
                <span className={stepMarkClass(view.step, view.reached, view.current, cancelled)}>
                  {view.reached && !view.current ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <span className="size-2 rounded-full bg-current" />
                  )}
                </span>
              </div>
              <div className={view.isLast ? 'min-w-0' : 'min-w-0 pb-5'}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className={view.reached ? 'text-sm font-medium text-ink' : 'text-sm text-muted'}>
                    {t(`orderStatus.${view.step}` as TranslationKey)}
                  </p>
                  {view.event ? (
                    <time className="text-xs text-muted" dateTime={view.event.createdAt}>
                      {formatWhen(view.event.createdAt, locale)}
                    </time>
                  ) : null}
                </div>
                {view.event?.message ? <p className="mt-1 text-sm leading-6 text-muted">{view.event.message}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-5">
        <div className="border border-mist bg-surface px-5 py-5 sm:col-span-3">
          <h2 className="text-sm font-medium text-ink">{t('account.items')}</h2>
          <ul className="mt-3 divide-y divide-mist">
            {order.items.map((item) => {
              const details = [item.color, item.size].filter(Boolean).join(' · ')
              return (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{locale === 'ar' ? item.nameAr : item.nameEn}</p>
                  {details ? <p className="mt-1 text-xs leading-5 text-muted">{details}</p> : null}
                  <p className="mt-1 text-xs text-muted">
                    {formatCount(item.quantity, locale)} × {formatCurrency(item.unitPrice, locale)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-ink">{formatCurrency(item.lineTotal, locale)}</p>
              </li>
              )
            })}
          </ul>
          <div className="mt-1 flex items-center justify-between border-t border-mist pt-4">
            <p className="text-sm text-muted">{t('account.total')}</p>
            <p className="font-display text-lg text-ink">{formatCurrency(order.total, locale)}</p>
          </div>
        </div>

        <div className="border border-mist bg-surface px-5 py-5 sm:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
            <MapPin size={16} aria-hidden />
            {t('account.address')}
          </h2>
          <p className="mt-3 text-sm font-medium text-ink">{order.recipientName}</p>
          <p className="mt-1 text-sm text-muted" dir="ltr">
            {order.recipientPhone}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            {order.street}
            <br />
            {order.city}
            {locale === 'ar' ? '، ' : ', '}
            {order.governorate}
          </p>
        </div>
      </div>

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
