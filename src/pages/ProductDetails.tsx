import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/common/Button'
import WhatsAppIcon from '../components/common/WhatsAppIcon'
import Loading from '../components/common/Loading'
import ProductGallery from '../components/products/ProductGallery'
import ProductGrid from '../components/products/ProductGrid'
import { useCatalog } from '../context/CatalogContext'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { localized } from '../i18n/types'
import { activeVariants, getCategoryName, getRelatedProducts, variantUnitPrice } from '../services/catalog'
import { formatCurrency } from '../utils/currency'
import { getProductDiscount } from '../utils/product'
import { buildProductInquiryMessage, openWhatsApp } from '../utils/whatsapp'

export default function ProductDetails() {
  const { slug } = useParams()
  const { locale, t } = useLocale()
  const { addToCart } = useCart()
  const { products, categories, ready } = useCatalog()
  const product = ready ? (products.find((item) => item.slug === slug) ?? null) : undefined
  const sellable = useMemo(() => (product ? activeVariants(product) : []), [product])
  const colors = useMemo(() => [...new Set(sellable.map((variant) => variant.color))], [sellable])
  const [selection, setSelection] = useState<{ productId: string; color: string; size: string } | null>(
    null,
  )
  const [quantityState, setQuantityState] = useState({ productId: '', quantity: 1 })
  const quantity = quantityState.productId === product?.id ? quantityState.quantity : 1
  const setQuantity = (update: number | ((current: number) => number)) => {
    if (!product) return
    setQuantityState((current) => {
      const base = current.productId === product.id ? current.quantity : 1
      const next = typeof update === 'function' ? update(base) : update
      return { productId: product.id, quantity: next }
    })
  }
  const chosen = selection?.productId === product?.id ? selection : null
  const color = chosen?.color ?? sellable[0]?.color ?? ''
  const size = chosen?.size ?? sellable.find((variant) => variant.color === color)?.size ?? ''

  const sizes = sellable.filter((variant) => variant.color === color)
  const variant = sizes.find((item) => item.size === size) ?? sizes[0]
  const unitPrice = product && variant ? variantUnitPrice(product.basePrice, variant) : product?.price ?? 0
  const stock = variant?.stock ?? 0

  const productName = product ? localized(product.name, locale) : undefined
  const productDescription = product ? localized(product.description, locale) : undefined

  usePageSeo(productName ?? t('product.detailsSeo'), productDescription ?? t('product.detailsFallback'))

  if (!ready || product === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <Loading label={t('common.loadingProduct')} />
      </div>
    )
  }

  if (!product) {
    return (
      <EmptyState
        title={t('product.notFoundTitle')}
        description={t('product.notFoundDescription')}
        actionLabel={t('common.viewAllProducts')}
        actionTo="/products"
      />
    )
  }

  const related = getRelatedProducts(products, product, 4)
  const discount = getProductDiscount({ ...product, price: unitPrice })
  const inStock = stock > 0
  const specEntries = product.specifications ?? []

  return (
    <section className="product-detail mx-auto max-w-[1232px] px-4 py-10 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <Link to="/products" className="hover:text-accent">
          {t('nav.products')}
        </Link>
        <span>/</span>
        <span className="min-w-0 break-words">{productName}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <ProductGallery images={product.images} alt={productName!} />
          <p className="mt-3 text-xs text-muted">{t('product.photoNote')}</p>
        </div>

        <div>
          <p className="text-sm text-accent">{getCategoryName(categories, product.categoryId, locale)}</p>
          <h1 className="mt-2 font-display text-3xl font-medium leading-tight sm:text-4xl">{productName}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-accent">{formatCurrency(unitPrice, locale)}</span>
            {product.oldPrice && product.oldPrice > unitPrice ? (
              <span className="text-muted line-through">{formatCurrency(product.oldPrice, locale)}</span>
            ) : null}
            {discount ? (
              <span className="rounded-full bg-warn px-2.5 py-1 text-xs font-semibold text-white">
                {t('common.discount', { percent: discount })}
              </span>
            ) : null}
          </div>

          <p className="mt-5 leading-8 text-muted">{productDescription}</p>

          {colors.length > 0 ? (
            <div className="mt-6">
              <p className="text-sm font-medium text-ink">{t('product.color')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      const next = sellable.find((item) => item.color === option)
                      setSelection({ productId: product.id, color: option, size: next?.size ?? '' })
                      setQuantity(1)
                    }}
                    className={[
                      'rounded-full border px-3 py-1.5 text-sm',
                      option === color ? 'border-accent bg-accent-soft text-accent' : 'border-mist',
                    ].join(' ')}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {sizes.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-ink">{t('product.size')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelection({ productId: product.id, color, size: option.size })
                      setQuantity(1)
                    }}
                    className={[
                      'rounded-xl border px-3 py-1.5 text-sm',
                      option.size === (variant?.size ?? size)
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-mist',
                    ].join(' ')}
                  >
                    {option.size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className={`mt-4 text-sm font-medium ${inStock ? 'text-success' : 'text-danger'}`}>
            {inStock ? t('product.inStock', { count: stock }) : t('product.outOfStock')}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-xl border border-mist">
              <button
                type="button"
                className="p-3 hover:bg-mist"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                aria-label={t('product.decreaseQty')}
              >
                <Minus size={16} />
              </button>
              <span className="min-w-10 text-center">{quantity}</span>
              <button
                type="button"
                className="p-3 hover:bg-mist"
                onClick={() => setQuantity((current) => Math.min(stock || 1, current + 1))}
                aria-label={t('product.increaseQty')}
                disabled={!inStock}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="purchase-actions mt-6 flex gap-3">
            <Button
              size="lg"
              className="min-w-0 flex-1"
              disabled={!inStock || !variant}
              onClick={() => variant && addToCart(product, quantity, variant.id)}
            >
              <ShoppingCart size={18} />
              {t('common.addToCartLong')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-w-0 flex-1"
              onClick={() => openWhatsApp(buildProductInquiryMessage(productName!, unitPrice, locale))}
            >
              <WhatsAppIcon size={18} />
              {t('product.buyWhatsapp')}
            </Button>
          </div>

          {specEntries.length > 0 ? (
            <div className="specs-table mt-8">
              <h2 className="bg-paper px-4 py-3 font-display text-lg font-semibold">{t('product.specs')}</h2>
              <dl>
                {specEntries.map((spec, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-1 border-t border-mist px-4 py-3 text-sm sm:grid-cols-2 sm:gap-3"
                  >
                    <dt className="text-muted">{localized(spec.label, locale)}</dt>
                    <dd className="min-w-0 font-medium break-words">{localized(spec.value, locale)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold">{t('product.related')}</h2>
          <ProductGrid products={related} />
        </div>
      ) : null}
    </section>
  )
}
