import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import Loading from '../components/common/Loading'
import { useLocale } from '../hooks/useLocale'
import type { TranslationKey } from '../i18n/translations'
import { fetchOrder, submitVodafoneProof, type StoreOrder } from '../services/orders'
import { formatCurrency } from '../utils/currency'
import { isValidEgyptianPhone } from '../utils/validation'

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

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-accent">{t('account.tracking')}</p>
      <h1 className="mt-1 font-display text-3xl text-ink">{order.reference}</h1>
      <p className="mt-2 text-muted">
        {t('account.status')}: {t(`orderStatus.${order.status}` as TranslationKey)}
      </p>
      <p className="text-muted">
        {t('account.payment')}: {order.paymentStatus ? t(`paymentStatus.${order.paymentStatus}` as TranslationKey) : '—'}
      </p>
      <p className="mt-2 font-medium">{formatCurrency(order.total, locale)}</p>
      <p className="mt-2 text-sm text-muted">
        {order.recipientName} · {order.recipientPhone}
        <br />
        {order.street}, {order.city}, {order.governorate}
      </p>

      <ul className="mt-6 space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-mist bg-surface p-4 text-sm">
            <p className="font-medium">{locale === 'ar' ? item.nameAr : item.nameEn}</p>
            <p className="text-muted">
              {item.color} · {item.size} · {item.quantity} × {formatCurrency(item.unitPrice, locale)}
            </p>
          </li>
        ))}
      </ul>

      <ol className="mt-6 space-y-2 border-s border-mist ps-4">
        {order.events.map((event) => (
          <li key={event.id}>
            <p className="text-sm font-medium">{t(`orderStatus.${event.toStatus}` as TranslationKey)}</p>
            {event.message ? <p className="text-sm text-muted">{event.message}</p> : null}
          </li>
        ))}
      </ol>

      {order.paymentMethod === 'vodafone_cash' && order.paymentStatus === 'awaiting_verification' ? (
        <form className="mt-6 space-y-3" onSubmit={(event) => void sendProof(event)}>
          <h2 className="font-display text-xl">{t('account.proof')}</h2>
          <input
            value={senderPhone}
            onChange={(event) => setSenderPhone(event.target.value)}
            placeholder={t('checkout.senderPhone')}
            className="w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm"
          />
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder={t('checkout.reference')}
            className="w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm"
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
