import { useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'react-router-dom'

import ProductFilters from '../components/products/ProductFilters'

import ProductGrid, { ProductGridShell } from '../components/products/ProductGrid'

import ProductSearch from '../components/products/ProductSearch'

import { ProductCardSkeleton } from '../components/common/Loading'

import { categories } from '../data/categories'

import { useLocale } from '../hooks/useLocale'

import { usePageSeo } from '../hooks/usePageSeo'

import { localized } from '../i18n/types'

import { filterAndSortProducts, fetchProducts, getCategoryBySlug } from '../services/catalog'

import type { Product, ProductSortOption } from '../types/product'



const sortValues: ProductSortOption[] = [

  'newest',

  'price-asc',

  'price-desc',

  'featured',

  'bestsellers',

]



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



  const search = params.get('search') ?? ''

  const categorySlug = params.get('category') ?? ''

  const sort = parseSort(params.get('sort'))

  const minPrice = params.get('minPrice') ?? ''

  const maxPrice = params.get('maxPrice') ?? ''

  const selectedCategory = categorySlug ? getCategoryBySlug(categorySlug) : undefined



  const categoryName = selectedCategory

    ? localized(selectedCategory.name, locale)

    : undefined



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

        search,

        categorySlug: categorySlug || undefined,

        minPrice: minPrice ? Number(minPrice) : undefined,

        maxPrice: maxPrice ? Number(maxPrice) : undefined,

        sort,

      }),

    [allProducts, search, categorySlug, minPrice, maxPrice, sort],

  )



  function updateParam(key: string, value: string) {

    const next = new URLSearchParams(params)

    if (!value) next.delete(key)

    else next.set(key, value)

    setParams(next, { replace: true })

  }



  function resetFilters() {

    setParams({}, { replace: true })

  }



  return (

    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

      <div className="mb-8">

        <p className="text-sm font-medium text-accent">{t('products.eyebrow')}</p>

        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl md:text-4xl">

          {categoryName ?? t('products.allTitle')}

        </h1>

        <p className="mt-2 text-muted">

          {selectedCategory?.description
            ? localized(selectedCategory.description, locale)
            : t('products.allDescription')}

        </p>

      </div>



      <div className="mb-6">

        <ProductSearch value={search} onChange={(value) => updateParam('search', value)} />

      </div>



      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">

        <ProductFilters

          categories={categories}

          categorySlug={categorySlug}

          sort={sort}

          minPrice={minPrice}

          maxPrice={maxPrice}

          onCategoryChange={(slug) => updateParam('category', slug)}

          onSortChange={(value) => updateParam('sort', value)}

          onMinPriceChange={(value) => updateParam('minPrice', value)}

          onMaxPriceChange={(value) => updateParam('maxPrice', value)}

          onReset={resetFilters}

        />



        <div className="min-w-0">

          {loading ? (

            <ProductGridShell>

              {Array.from({ length: 8 }).map((_, index) => (

                <ProductCardSkeleton key={index} />

              ))}

            </ProductGridShell>

          ) : (

            <>

              <p className="mb-4 text-sm text-muted">

                {t('common.productCount', { count: visible.length })}

              </p>

              <ProductGrid

                products={visible}

                emptyTitle={t('products.emptyTitle')}

                emptyDescription={t('products.emptyDescription')}

              />

            </>

          )}

        </div>

      </div>

    </section>

  )

}

