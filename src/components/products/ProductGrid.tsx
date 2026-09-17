import type { ReactNode } from 'react'
import { useLocale } from '../../hooks/useLocale'
import type { Product } from '../../types/product'
import EmptyState from '../common/EmptyState'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[]
  emptyTitle?: string
  emptyDescription?: string
}

/** Container queries so columns follow available width, not just the viewport. */
export const productGridClassName =
  'grid grid-cols-1 gap-3 @min-[20rem]:grid-cols-2 @min-[40rem]:grid-cols-3 @min-[64rem]:grid-cols-4 sm:gap-5'

export function ProductGridShell({ children }: { children: ReactNode }) {
  return (
    <div className="@container min-w-0 w-full">
      <div className={productGridClassName}>{children}</div>
    </div>
  )
}

export default function ProductGrid({
  products,
  emptyTitle,
  emptyDescription,
}: ProductGridProps) {
  const { t } = useLocale()
  const title = emptyTitle ?? t('products.emptyDefaultTitle')
  const description = emptyDescription ?? t('products.emptyDefaultDescription')

  if (products.length === 0) {
    return <EmptyState title={title} description={description} />
  }

  return (
    <ProductGridShell>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ProductGridShell>
  )
}
