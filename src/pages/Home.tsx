import { useMemo, useState } from 'react'
import CategoriesSection from '../components/home/Categories'
import Hero from '../components/home/Hero'
import ShoppingGuide from '../components/home/ShoppingGuide'
import WhatsAppCta from '../components/home/WhatsAppCta'
import CatalogBrowser, { type CatalogQuery } from '../components/products/CatalogBrowser'
import { storeConfig } from '../config/store'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { localized } from '../i18n/types'
import { useCatalog } from '../context/CatalogContext'
import { filterAndSortProducts } from '../services/catalog'

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
  const { products, categories, ready } = useCatalog()
  const ar = locale === 'ar'
  usePageSeo(t('home.seoTitle'), localized(storeConfig.description, locale))
  const [query, setQuery] = useState<CatalogQuery>(initialQuery)

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
    [products, categories, query],
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
          loading={!ready}
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
