import type { Product } from '../../types/product'
import EmptyState from '../common/EmptyState'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[]
  emptyTitle?: string
  emptyDescription?: string
}

export default function ProductGrid({
  products,
  emptyTitle = 'لا توجد منتجات',
  emptyDescription = 'جرّب تغيير البحث أو الفلاتر.',
}: ProductGridProps) {
  if (products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
