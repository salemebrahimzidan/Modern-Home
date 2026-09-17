import { Link } from 'react-router-dom'
import { getOfferProducts } from '../../services/catalog'
import { formatCurrency } from '../../utils/currency'
import { getProductDiscount, getProductPath } from '../../utils/product'
import Button from '../common/Button'

export default function OffersSection() {
  const offers = getOfferProducts(4)

  return (
    <section className="bg-accent-soft py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-accent">عروض خاصة</p>
            <h2 className="mt-1 font-display text-3xl font-bold">وفر أكثر على أدوات المطبخ</h2>
          </div>
          <Link to="/offers">
            <Button>شوف كل العروض</Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {offers.map((product) => {
            const discount = getProductDiscount(product)
            return (
              <Link
                key={product.id}
                to={getProductPath(product)}
                className="overflow-hidden rounded-2xl border border-mist/60 bg-surface shadow-card transition hover:shadow-soft"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-4">
                  {discount ? (
                    <span className="rounded-full bg-warn px-2 py-1 text-xs font-semibold text-white">
                      خصم {discount}%
                    </span>
                  ) : null}
                  <h3 className="mt-2 line-clamp-2 font-semibold">{product.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-bold text-accent">{formatCurrency(product.price)}</span>
                    {product.oldPrice ? (
                      <span className="text-sm text-muted line-through">
                        {formatCurrency(product.oldPrice)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
