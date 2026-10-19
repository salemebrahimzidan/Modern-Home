import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CatalogBrowser, { type CatalogQuery } from '../components/products/CatalogBrowser'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { localized } from '../i18n/types'
import { fetchProducts, filterAndSortProducts, getCategoryBySlug } from '../services/catalog'
import type { Product, ProductSortOption } from '../types/product'

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
  const [params, setParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [allProducts, setAllProducts] = useState<Product[]>([])

  const query: CatalogQuery = {
    search: params.get('search') ?? '',
    material: params.get('material') ?? '',
    categorySlug: params.get('category') ?? '',
    sort: parseSort(params.get('sort')),
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
  }

  const selectedCategory = query.categorySlug ? getCategoryBySlug(query.categorySlug) : undefined
  const categoryName = selectedCategory ? localized(selectedCategory.name, locale) : undefined

  usePageSeo(
    categoryName ?? t('products.seoTitle'),
    selectedCategory
      ? t('products.shopCategory', { name: categoryName! })
      : t('products.browseAll'),
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    void fetchProducts().then((data) => {
      if (!active) return
      setAllProducts(data)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const visible = useMemo(
    () =>
      filterAndSortProducts(allProducts, {
        search: query.search,
        material: query.material,
        categorySlug: query.categorySlug || undefined,
        minPrice: query.minPrice ? Number(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
        sort: query.sort,
      }),
    [allProducts, query.search, query.material, query.categorySlug, query.minPrice, query.maxPrice, query.sort],
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
        sourceProducts={allProducts}
        visibleProducts={visible}
        loading={loading}
        query={query}
        onChange={updateParam}
        onReset={() => setParams({}, { replace: false })}
        emptyTitle={t('products.emptyTitle')}
        emptyDescription={t('products.emptyDescription')}
      />
    </section>
  )
}
