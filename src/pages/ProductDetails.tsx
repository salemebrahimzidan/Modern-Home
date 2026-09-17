import { MessageCircle, Minus, Plus, ShoppingCart, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import ProductGallery from '../components/products/ProductGallery'
import ProductCard from '../components/products/ProductCard'
import { useCart } from '../hooks/useCart'
import { usePageSeo } from '../hooks/usePageSeo'
import {
  fetchProductBySlug,
  getCategoryName,
  getRelatedProducts,
} from '../services/catalog'
import type { Product } from '../types/product'
import { formatCurrency } from '../utils/currency'
import { getProductDiscount } from '../utils/product'
import { buildProductInquiryMessage, openWhatsApp } from '../utils/whatsapp'

export default function ProductDetails() {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let active = true
    setProduct(undefined)
    setQuantity(1)
    if (!slug) {
      setProduct(null)
      return
    }
    void fetchProductBySlug(slug).then((data) => {
      if (!active) return
      setProduct(data ?? null)
    })
    return () => {
      active = false
    }
  }, [slug])

  usePageSeo(
    product?.name ?? 'تفاصيل المنتج',
    product?.description ?? 'تفاصيل منتج من معرض أدوات المطبخ Modern Home.',
  )

  if (product === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <Loading label="جاري تحميل المنتج..." />
      </div>
    )
  }

  if (!product) {
    return (
      <EmptyState
        title="المنتج غير موجود"
        description="قد يكون الرابط غير صحيح أو تم إزالة المنتج."
        actionLabel="عرض كل المنتجات"
        actionTo="/products"
      />
    )
  }

  const related = getRelatedProducts(product, 4)
  const discount = getProductDiscount(product)
  const inStock = product.stock > 0
  const specEntries = product.specifications
    ? Object.entries(product.specifications)
    : []

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link to="/products" className="hover:text-accent">
          المنتجات
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />

        <div>
          <p className="text-sm text-accent">{getCategoryName(product.categoryId)}</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{product.name}</h1>

          {product.rating ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Star size={16} className="fill-warn text-warn" aria-hidden />
              <span>
                {product.rating}
                {product.reviewsCount ? ` (${product.reviewsCount} تقييم)` : ''}
              </span>
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-accent">
              {formatCurrency(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price ? (
              <span className="text-muted line-through">
                {formatCurrency(product.oldPrice)}
              </span>
            ) : null}
            {discount ? (
              <span className="rounded-full bg-warn px-2.5 py-1 text-xs font-semibold text-white">
                خصم {discount}%
              </span>
            ) : null}
            {product.isBestSeller ? (
              <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
                الأكثر مبيعاً
              </span>
            ) : null}
          </div>

          <p className="mt-5 leading-8 text-muted">{product.description}</p>

          <p className={`mt-4 text-sm font-medium ${inStock ? 'text-success' : 'text-danger'}`}>
            {inStock ? `متوفر (${product.stock} قطعة)` : 'غير متوفر حالياً'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-xl border border-mist">
              <button
                type="button"
                className="p-3 hover:bg-mist"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="تقليل الكمية"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-10 text-center">{quantity}</span>
              <button
                type="button"
                className="p-3 hover:bg-mist"
                onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
                aria-label="زيادة الكمية"
                disabled={!inStock}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" disabled={!inStock} onClick={() => addToCart(product, quantity)}>
              <ShoppingCart size={18} />
              أضف إلى السلة
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-[#128C7E]"
              onClick={() =>
                openWhatsApp(buildProductInquiryMessage(product.name, product.price))
              }
            >
              <MessageCircle size={18} />
              اشترِ عبر واتساب
            </Button>
          </div>

          {specEntries.length > 0 ? (
            <div className="mt-8 overflow-hidden rounded-2xl border border-mist/70">
              <h2 className="bg-paper px-4 py-3 font-display text-lg font-semibold">المواصفات</h2>
              <dl>
                {specEntries.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-2 gap-3 border-t border-mist px-4 py-3 text-sm"
                  >
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold">منتجات ذات صلة</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
