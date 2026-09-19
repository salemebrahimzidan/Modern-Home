import { Percent } from 'lucide-react'
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
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent sm:h-11 sm:w-11">
          <Percent size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-accent">{t('offers.eyebrow')}</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold sm:text-3xl">{t('offers.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{t('offers.description')}</p>
          <p className="mt-2 text-xs text-muted">{t('offers.count', { count: offers.length })}</p>
        </div>
      </div>

      <ProductGrid
        products={offers}
        emptyTitle={t('offers.emptyTitle')}
        emptyDescription={t('offers.emptyDescription')}
      />
    </section>
  )
}
