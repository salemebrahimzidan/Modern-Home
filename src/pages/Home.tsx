import { useEffect, useMemo, useState } from 'react'
import CategoriesSection from '../components/home/Categories'
import Hero from '../components/home/Hero'
import ShoppingGuide from '../components/home/ShoppingGuide'
import WhatsAppCta from '../components/home/WhatsAppCta'
import CatalogBrowser, { type CatalogQuery } from '../components/products/CatalogBrowser'
import { storeConfig } from '../config/store'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { localized } from '../i18n/types'
import { fetchProducts, filterAndSortProducts } from '../services/catalog'
import type { Product } from '../types/product'

const initialQuery: CatalogQuery = {
  search: '',
  material: '',
  categorySlug: '',
  sort: 'featured',
  minPrice: '',
  maxPrice: '',
}

export default function Home() {
  const { locale, t } = useLocale()
  const ar = locale === 'ar'
  usePageSeo(t('home.seoTitle'), localized(storeConfig.description, locale))
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState<CatalogQuery>(initialQuery)

  useEffect(() => {
    let active = true
    void fetchProducts().then((data) => {
      if (!active) return
      setProducts(data)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const visible = useMemo(
    () =>
      filterAndSortProducts(products, {
        search: query.search,
        material: query.material,
        categorySlug: query.categorySlug || undefined,
        minPrice: query.minPrice ? Number(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
        sort: query.sort,
      }),
    [products, query],
  )

  return (
    <>
      <Hero />
      <CategoriesSection />
      <section className="catalog-section">
        <CatalogBrowser
          anchorId="catalog"
          eyebrow={ar ? 'التشكيلة' : 'The edit'}
          title={ar ? 'اختار من أدوات المطبخ' : 'Choose your kitchen pieces'}
          description={
            ar
              ? 'ابحث بالاسم أو الوصف، وصفِّ حسب القسم والخامة والسعر.'
              : 'Search names and descriptions, then filter by category, material, and price.'
          }
          sourceProducts={products}
          visibleProducts={visible}
          loading={loading}
          query={query}
          onChange={(key, value) => setQuery((current) => ({ ...current, [key]: value }))}
          onReset={() => setQuery(initialQuery)}
          emptyTitle={t('products.emptyTitle')}
          emptyDescription={t('products.emptyDescription')}
        />
      </section>
      <ShoppingGuide />
      <WhatsAppCta />
    </>
  )
}
