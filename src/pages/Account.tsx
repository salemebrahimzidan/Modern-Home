import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import DirectionalArrow from '../components/common/DirectionalArrow'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import type { TranslationKey } from '../i18n/translations'
import { fetchMyOrders, type StoreOrder } from '../services/orders'
import { formatCurrency } from '../utils/currency'

export default function Account() {
  const { locale, t } = useLocale()
  const { profile, user } = useAuth()
  const [orders, setOrders] = useState<StoreOrder[] | null>(null)

  useEffect(() => {
    let active = true
    void fetchMyOrders()
      .then((data) => {
        if (active) setOrders(data)
      })
      .catch(() => {
        if (active) setOrders([])
      })
    return () => {
      active = false
    }
  }, [])

  const name = profile?.fullName || user?.email || ''
  const latest = orders?.slice(0, 3) ?? []

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <p className="eyebrow">{t('account.title')}</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{name}</h1>

      <div className="mt-8">
        <Link
          to="/account/orders"
          className="flex flex-col justify-between border border-mist bg-surface px-5 py-5 transition-colors hover:border-accent"
        >
          <div>
            <Package size={18} className="text-accent" aria-hidden />
            <h2 className="mt-3 font-display text-2xl text-ink">{t('account.orders')}</h2>
            <p className="mt-1 text-sm text-muted">
              {orders === null ? t('common.loading') : orders.length === 0 ? t('account.empty') : String(orders.length)}
            </p>
          </div>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent">
            {t('account.orders')}
            <DirectionalArrow size={16} />
          </span>
        </Link>
      </div>

      <div className="mt-4 border border-mist bg-surface px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-ink">{t('account.latest')}</h2>
          <Link to="/account/orders" className="text-xs text-accent hover:text-accent-dark">
            {t('account.orders')}
          </Link>
        </div>
        {orders === null ? (
          <p className="mt-4 text-sm text-muted">{t('common.loading')}</p>
        ) : latest.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t('account.empty')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-mist">
            {latest.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/account/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:text-accent"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{order.reference}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t(`orderStatus.${order.status}` as TranslationKey)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-ink">{formatCurrency(order.total, locale)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

    </section>
  )
}
