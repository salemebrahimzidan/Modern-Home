import { Link } from 'react-router-dom'
import { getOfferProducts } from '../../services/catalog'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import { formatCurrency } from '../../utils/currency'
import { getProductDiscount, getProductPath } from '../../utils/product'
import Button from '../common/Button'
import { productGridClassName } from '../products/ProductGrid'

export default function OffersSection() {
  const { locale, t } = useLocale()
  const offers = getOfferProducts(4)

  return (
    <section className="bg-accent-soft py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-accent">{t('home.offersEyebrow')}</p>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{t('home.offersTitle')}</h2>
          </div>
          <Link to="/offers" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">{t('home.seeAllOffers')}</Button>
          </Link>
        </div>
        <div className="@container min-w-0">
          <div className={productGridClassName}>
          {offers.map((product) => {
            const discount = getProductDiscount(product)
            const name = localized(product.name, locale)
            return (
              <Link
                key={product.id}
                to={getProductPath(product)}
                className="min-w-0 overflow-hidden rounded-2xl border border-mist/60 bg-surface shadow-card transition hover:shadow-soft"
              >
                <img
                  src={product.image}
                  alt={name}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-3 sm:p-4">
                  {discount ? (
                    <span className="rounded-full bg-warn px-2 py-0.5 text-[10px] font-semibold text-white sm:py-1 sm:text-xs">
                      {t('common.discount', { percent: discount })}
                    </span>
                  ) : null}
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold sm:text-base">{name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-sm font-bold text-accent sm:text-base">
                      {formatCurrency(product.price, locale)}
                    </span>
                    {product.oldPrice ? (
                      <span className="text-xs text-muted line-through sm:text-sm">
                        {formatCurrency(product.oldPrice, locale)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            )
          })}
          </div>
        </div>
      </div>
    </section>
  )
}
