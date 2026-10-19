import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import CatalogBrowser, { type CatalogQuery } from '../components/products/CatalogBrowser'
import { useCatalog } from '../context/CatalogContext'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { localized } from '../i18n/types'
import { filterAndSortProducts, getCategoryBySlug } from '../services/catalog'
import type { ProductSortOption } from '../types/product'

const sortValues: ProductSortOption[] = [
  'newest',
  'price-asc',
  'price-desc',
  'featured',
  'bestsellers',
]

const replaceKeys = new Set<keyof CatalogQuery>(['search', 'minPrice', 'maxPrice'])

function parseSort(value: string | null): ProductSortOption {
  if (value && sortValues.includes(value as ProductSortOption)) {
    return value as ProductSortOption
  }
  return 'newest'
}

export default function ProductsPage() {
  const { locale, t } = useLocale()
  const { products, categories, ready } = useCatalog()
  const [params, setParams] = useSearchParams()

  const query: CatalogQuery = {
    search: params.get('search') ?? '',
    material: params.get('material') ?? '',
    categorySlug: params.get('category') ?? '',
    sort: parseSort(params.get('sort')),
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
  }

  const selectedCategory = query.categorySlug
    ? getCategoryBySlug(categories, query.categorySlug)
    : undefined
  const categoryName = selectedCategory ? localized(selectedCategory.name, locale) : undefined

  usePageSeo(
    categoryName ?? t('products.seoTitle'),
    selectedCategory
      ? t('products.shopCategory', { name: categoryName! })
      : t('products.browseAll'),
  )

  const visible = useMemo(
    () =>
      filterAndSortProducts(products, categories, {
        search: query.search,
        material: query.material,
        categorySlug: query.categorySlug || undefined,
        minPrice: query.minPrice ? Number(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
        sort: query.sort,
      }),
    [products, categories, query.search, query.material, query.categorySlug, query.minPrice, query.maxPrice, query.sort],
  )

  function updateParam(key: keyof CatalogQuery, value: string) {
    const paramKey = key === 'categorySlug' ? 'category' : key
    const next = new URLSearchParams(params)
    if (!value || (key === 'sort' && value === 'newest')) next.delete(paramKey)
    else next.set(paramKey, value)
    setParams(next, { replace: replaceKeys.has(key) })
  }

  return (
    <section className="catalog-section catalog-page">
      <header className="catalog-intro">
        <p className="eyebrow">{t('products.eyebrow')}</p>
        <h1>{categoryName ?? t('products.allTitle')}</h1>
        <p>
          {selectedCategory?.description
            ? localized(selectedCategory.description, locale)
            : t('products.allDescription')}
        </p>
      </header>
      <CatalogBrowser
        sourceProducts={products}
        visibleProducts={visible}
        loading={!ready}
        query={query}
        onChange={updateParam}
        onReset={() => setParams({}, { replace: false })}
        emptyTitle={t('products.emptyTitle')}
        emptyDescription={t('products.emptyDescription')}
      />
    </section>
  )
}
