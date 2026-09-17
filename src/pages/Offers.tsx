import { useMemo } from 'react'
import ProductGrid from '../components/products/ProductGrid'
import { usePageSeo } from '../hooks/usePageSeo'
import { getOfferProducts } from '../services/catalog'

export default function Offers() {
  usePageSeo('العروض', 'خصومات وعروض خاصة على أدوات ومستلزمات المطبخ.')
  const offers = useMemo(() => getOfferProducts(), [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 overflow-hidden rounded-3xl bg-accent-soft px-6 py-10 sm:px-10">
        <p className="text-sm font-medium text-accent">أفضل الصفقات</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">عروض أدوات المطبخ</h1>
        <p className="mt-3 max-w-2xl text-muted">
          منتجات مخفّضة من أواني الطهي وأدوات التحضير والتخزين. الأسعار القديمة والجديدة واضحة
          قبل الطلب عبر واتساب.
        </p>
      </div>

      <p className="mb-4 text-sm text-muted">{offers.length} عرض متاح</p>
      <ProductGrid
        products={offers}
        emptyTitle="لا توجد عروض حالياً"
        emptyDescription="عد لاحقاً لمشاهدة تخفيضات جديدة على أدوات المطبخ."
      />
    </section>
  )
}
