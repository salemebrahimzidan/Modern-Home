import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import DirectionalArrow from '../components/common/DirectionalArrow'
import EmptyState from '../components/common/EmptyState'
import Loading from '../components/common/Loading'
import { useLocale } from '../hooks/useLocale'
import type { Locale } from '../i18n/types'
import type { TranslationKey } from '../i18n/translations'
import { fetchMyOrders, type StoreOrder } from '../services/orders'
import { formatCurrency } from '../utils/currency'

function formatWhen(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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

export default function Orders() {
  const { locale, t } = useLocale()
  const [orders, setOrders] = useState<StoreOrder[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void fetchMyOrders()
      .then((data) => {
        if (active) setOrders(data)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : t('checkout.failed'))
      })
    return () => {
      active = false
    }
  }, [t])

  if (error) return <p className="mx-auto max-w-3xl px-4 py-10 text-danger">{error}</p>
  if (!orders) return <Loading label={t('common.loading')} />

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="border-b border-mist pb-6">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{t('account.orders')}</h1>
        <p className="mt-2 text-sm text-muted">
          {orders.length === 0 ? t('account.empty') : t('account.orderCount', { count: formatCount(orders.length, locale) })}
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title={t('account.empty')}
          actionLabel={t('common.viewAllProducts')}
          actionTo="/products"
          icon={<Package size={28} aria-hidden />}
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} locale={locale} t={t} />
          ))}
        </ul>
      )}
    </section>
  )
}

function OrderCard({
  order,
  locale,
  t,
}: {
  order: StoreOrder
  locale: Locale
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}) {
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const names = order.items
    .slice(0, 2)
    .map((item) => {
      const name = locale === 'ar' ? item.nameAr : item.nameEn
      return name ? `${formatCount(item.quantity, locale)} × ${name}` : ''
    })
    .filter(Boolean)
  const extra = order.items.length - names.length
  const paymentKey = order.paymentMethod === 'vodafone_cash' ? 'checkout.vodafone' : 'checkout.cod'

  return (
    <li>
      <Link
        to={`/account/orders/${order.id}`}
        className="group block border border-mist bg-surface px-5 py-5 transition-colors hover:border-accent sm:px-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted">{t('account.reference')}</p>
            <p className="mt-1 font-display text-xl text-ink">{order.reference}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusTone(order.status)}`}>
            {t(`orderStatus.${order.status}` as TranslationKey)}
          </span>
        </div>

        {names.length > 0 ? (
          <p className="mt-4 text-sm leading-6 text-ink">
            {names.join(locale === 'ar' ? '، ' : ', ')}
            {extra > 0 ? ` +${extra}` : ''}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-mist pt-4">
          <p className="min-w-0 text-xs leading-5 text-muted">
            <time dateTime={order.createdAt}>{formatWhen(order.createdAt, locale)}</time>
            {' · '}
            {t(paymentKey)}
            {' · '}
            {t('common.productCount', { count: formatCount(quantity, locale) })}
          </p>
          <span className="flex shrink-0 items-center gap-3">
            <span className="font-display text-lg text-ink">{formatCurrency(order.total, locale)}</span>
            <span className="text-accent">
              <DirectionalArrow size={16} />
            </span>
          </span>
        </div>
      </Link>
    </li>
  )
}
