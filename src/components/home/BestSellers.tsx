import { Link } from 'react-router-dom'
import { getBestSellerProducts } from '../../services/catalog'
import ProductCard from '../products/ProductCard'

export default function BestSellers() {
  const items = getBestSellerProducts(8)

  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">الأكثر مبيعاً</p>
          <h2 className="mt-1 font-display text-3xl font-bold">اختيارات الزبائن</h2>
        </div>
        <Link to="/products?sort=bestsellers" className="text-sm text-muted hover:text-accent">
          عرض المزيد
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
