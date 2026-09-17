import { Link } from 'react-router-dom'
import { getNewProducts } from '../../services/catalog'
import { useLocale } from '../../hooks/useLocale'
import ProductGrid from '../products/ProductGrid'

export default function LatestProducts() {
  const { t } = useLocale()
  const items = getNewProducts(8)

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-accent">{t('home.newEyebrow')}</p>
          <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{t('home.newTitle')}</h2>
        </div>
        <Link
          to="/products?sort=newest"
          className="shrink-0 self-start text-sm text-muted hover:text-accent sm:self-auto"
        >
          {t('common.viewAll')}
        </Link>
      </div>
      <ProductGrid products={items} />
    </section>
  )
}
