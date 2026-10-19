import { useMemo } from 'react'
import { categories } from '../../data/categories'
import { useLocale } from '../../hooks/useLocale'
import { ProductCardSkeleton } from '../common/Loading'
import ProductFilters from './ProductFilters'
import ProductGrid, { ProductGridShell } from './ProductGrid'
import ProductSearch from './ProductSearch'
import type { Product, ProductSortOption } from '../../types/product'

export interface CatalogQuery {
  search: string
  material: string
  categorySlug: string
  sort: ProductSortOption
  minPrice: string
  maxPrice: string
}

interface CatalogBrowserProps {
  sourceProducts: Product[]
  visibleProducts: Product[]
  loading?: boolean
  query: CatalogQuery
  onChange: (key: keyof CatalogQuery, value: string) => void
  onReset: () => void
  anchorId?: string
  eyebrow?: string
  title?: string
  description?: string
  emptyTitle?: string
  emptyDescription?: string
}

export default function CatalogBrowser({
  sourceProducts,
  visibleProducts,
  loading = false,
  query,
  onChange,
  onReset,
  anchorId,
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: CatalogBrowserProps) {
  const { t } = useLocale()
  const materials = useMemo(
    () =>
      Array.from(
        new Map(
          sourceProducts.flatMap((product) =>
            (product.specifications ?? [])
              .filter((spec) => spec.label.en === 'Material')
              .map((spec) => [spec.value.en, spec.value] as const),
          ),
        ).values(),
      ),
    [sourceProducts],
  )

  return (
    <div id={anchorId}>
      {title ? (
        <header className="catalog-intro">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </header>
      ) : null}

      <ProductSearch value={query.search} onChange={(value) => onChange('search', value)} />
      <ProductFilters
        materials={materials}
        material={query.material}
        onMaterialChange={(value) => onChange('material', value)}
        categories={categories}
        categorySlug={query.categorySlug}
        sort={query.sort}
        minPrice={query.minPrice}
        maxPrice={query.maxPrice}
        onCategoryChange={(slug) => onChange('categorySlug', slug)}
        onSortChange={(value) => onChange('sort', value)}
        onMinPriceChange={(value) => onChange('minPrice', value)}
        onMaxPriceChange={(value) => onChange('maxPrice', value)}
        onReset={onReset}
      />

      {loading ? (
        <ProductGridShell>
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </ProductGridShell>
      ) : (
        <>
          <p className="catalog-count">{t('common.productCount', { count: visibleProducts.length })}</p>
          <ProductGrid
            products={visibleProducts}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        </>
      )}
    </div>
  )
}
