import { Link } from 'react-router-dom'
import { getBestSellerProducts } from '../../services/catalog'
import { useLocale } from '../../hooks/useLocale'
import ProductGrid from '../products/ProductGrid'

export default function BestSellers() {
  const { t } = useLocale()
  const items = getBestSellerProducts(8)

  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-accent">{t('home.bestsellersEyebrow')}</p>
          <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {t('home.bestsellersTitle')}
          </h2>
        </div>
        <Link
          to="/products?sort=bestsellers"
          className="shrink-0 self-start text-sm text-muted hover:text-accent sm:self-auto"
        >
          {t('common.viewMore')}
        </Link>
      </div>
      <ProductGrid products={items} />
    </section>
  )
}
