import { useMemo } from 'react'
import ProductGrid from '../components/products/ProductGrid'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { getOfferProducts } from '../services/catalog'

export default function Offers() {
  const { t } = useLocale()
  usePageSeo(t('offers.seoTitle'), t('offers.seoDescription'))
  const offers = useMemo(() => getOfferProducts(), [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 overflow-hidden rounded-3xl bg-accent-soft px-5 py-8 sm:px-10 sm:py-10">
        <p className="text-sm font-medium text-accent">{t('offers.eyebrow')}</p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl md:text-4xl">{t('offers.title')}</h1>
        <p className="mt-3 max-w-2xl text-muted">{t('offers.description')}</p>
      </div>

      <p className="mb-4 text-sm text-muted">{t('offers.count', { count: offers.length })}</p>
      <ProductGrid
        products={offers}
        emptyTitle={t('offers.emptyTitle')}
        emptyDescription={t('offers.emptyDescription')}
      />
    </section>
  )
}
