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
        <ul className="mt-6 divide-y divide-mist border border-mist bg-surface">
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
  const first = order.items[0]
  const firstName = first ? (locale === 'ar' ? first.nameAr : first.nameEn) : ''
  const extra = Math.max(order.items.length - 1, 0)

  return (
    <li>
      <Link
        to={`/account/orders/${order.id}`}
        className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent-soft sm:gap-4 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p className="font-display text-base text-ink">{order.reference}</p>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusTone(order.status)}`}>
              {t(`orderStatus.${order.status}` as TranslationKey)}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted">
            <time dateTime={order.createdAt}>{formatWhen(order.createdAt, locale)}</time>
            {first && firstName ? ` · ${formatCount(first.quantity, locale)} × ${firstName}` : ''}
            {extra > 0 ? ` +${formatCount(extra, locale)}` : ''}
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-ink">{formatCurrency(order.total, locale)}</span>
        <span className="shrink-0 text-muted transition-colors group-hover:text-accent">
          <DirectionalArrow size={16} />
        </span>
      </Link>
    </li>
  )
}
