import { Link } from 'react-router-dom'
import { getFeaturedProducts } from '../../services/catalog'
import ProductCard from '../products/ProductCard'

export default function FeaturedProducts() {
  const items = getFeaturedProducts(8)

  return (
    <section className="bg-mist/40 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-accent">مختاراتنا</p>
            <h2 className="mt-1 font-display text-3xl font-bold">منتجات مميزة للمطبخ</h2>
          </div>
          <Link to="/products?sort=featured" className="text-sm text-muted hover:text-accent">
            عرض المزيد
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
