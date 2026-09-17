import { Link } from 'react-router-dom'
import { getFeaturedProducts } from '../../services/catalog'
import { useLocale } from '../../hooks/useLocale'
import ProductGrid from '../products/ProductGrid'

export default function FeaturedProducts() {
  const { t } = useLocale()
  const items = getFeaturedProducts(8)

  return (
    <section className="bg-mist/40 py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-accent">{t('home.featuredEyebrow')}</p>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              {t('home.featuredTitle')}
            </h2>
          </div>
          <Link
            to="/products?sort=featured"
            className="shrink-0 self-start text-sm text-muted hover:text-accent sm:self-auto"
          >
            {t('common.viewMore')}
          </Link>
        </div>
        <ProductGrid products={items} />
      </div>
    </section>
  )
}
