import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../components/common/Loading'
import { useLocale } from '../hooks/useLocale'
import type { TranslationKey } from '../i18n/translations'
import { fetchMyOrders, type StoreOrder } from '../services/orders'
import { formatCurrency } from '../utils/currency'

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
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl text-ink">{t('account.orders')}</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted">{t('account.empty')}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-mist bg-surface p-4">
              <Link to={`/account/orders/${order.id}`} className="block hover:text-accent">
                <p className="font-medium">
                  {t('account.reference')}: {order.reference}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {t(`orderStatus.${order.status}` as TranslationKey)} ·{' '}
                  {formatCurrency(order.total, locale)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
