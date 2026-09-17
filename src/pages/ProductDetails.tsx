import { Minus, Plus, ShoppingCart, Star } from 'lucide-react'

import { useEffect, useState } from 'react'

import { Link, useParams } from 'react-router-dom'

import EmptyState from '../components/common/EmptyState'

import Button from '../components/common/Button'
import WhatsAppIcon from '../components/common/WhatsAppIcon'

import Loading from '../components/common/Loading'

import ProductGallery from '../components/products/ProductGallery'

import ProductGrid from '../components/products/ProductGrid'

import { useCart } from '../hooks/useCart'

import { useLocale } from '../hooks/useLocale'

import { usePageSeo } from '../hooks/usePageSeo'

import { localized } from '../i18n/types'

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

  const { locale, t } = useLocale()

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



  const productName = product ? localized(product.name, locale) : undefined

  const productDescription = product ? localized(product.description, locale) : undefined



  usePageSeo(

    productName ?? t('product.detailsSeo'),

    productDescription ?? t('product.detailsFallback'),

  )



  if (product === undefined) {

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



  const related = getRelatedProducts(product, 4)

  const discount = getProductDiscount(product)

  const inStock = product.stock > 0

  const specEntries = product.specifications ?? []



  return (

    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

      <nav className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">

        <Link to="/products" className="hover:text-accent">

          {t('nav.products')}

        </Link>

        <span>/</span>

        <span className="min-w-0 break-words">{productName}</span>

      </nav>



      <div className="grid gap-10 lg:grid-cols-2">

        <ProductGallery images={product.images} alt={productName!} />



        <div>

          <p className="text-sm text-accent">{getCategoryName(product.categoryId, locale)}</p>

          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl md:text-4xl">{productName}</h1>



          {product.rating ? (

            <p className="mt-3 flex items-center gap-2 text-sm text-muted">

              <Star size={16} className="fill-warn text-warn" aria-hidden />

              <span>

                {product.rating}

                {product.reviewsCount

                  ? ` ${t('product.reviews', { count: product.reviewsCount })}`

                  : ''}

              </span>

            </p>

          ) : null}



          <div className="mt-4 flex flex-wrap items-center gap-3">

            <span className="text-2xl font-bold text-accent">

              {formatCurrency(product.price, locale)}

            </span>

            {product.oldPrice && product.oldPrice > product.price ? (

              <span className="text-muted line-through">

                {formatCurrency(product.oldPrice, locale)}

              </span>

            ) : null}

            {discount ? (

              <span className="rounded-full bg-warn px-2.5 py-1 text-xs font-semibold text-white">

                {t('common.discount', { percent: discount })}

              </span>

            ) : null}

            {product.isBestSeller ? (

              <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">

                {t('common.bestSeller')}

              </span>

            ) : null}

          </div>



          <p className="mt-5 leading-8 text-muted">{productDescription}</p>



          <p className={`mt-4 text-sm font-medium ${inStock ? 'text-success' : 'text-danger'}`}>

            {inStock

              ? t('product.inStock', { count: product.stock })

              : t('product.outOfStock')}

          </p>



          <div className="mt-6 flex flex-wrap items-center gap-4">

            <div className="inline-flex items-center rounded-xl border border-mist">

              <button

                type="button"

                className="p-3 hover:bg-mist"

                onClick={() => setQuantity((q) => Math.max(1, q - 1))}

                aria-label={t('product.decreaseQty')}

              >

                <Minus size={16} />

              </button>

              <span className="min-w-10 text-center">{quantity}</span>

              <button

                type="button"

                className="p-3 hover:bg-mist"

                onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}

                aria-label={t('product.increaseQty')}

                disabled={!inStock}

              >

                <Plus size={16} />

              </button>

            </div>

          </div>



          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">

            <Button

              size="lg"

              className="w-full sm:w-auto"

              disabled={!inStock}

              onClick={() => addToCart(product, quantity)}

            >

              <ShoppingCart size={18} />

              {t('common.addToCartLong')}

            </Button>

            <Button

              size="lg"

              variant="outline"

              className="w-full text-[#128C7E] sm:w-auto"

              onClick={() =>

                openWhatsApp(

                  buildProductInquiryMessage(productName!, product.price, locale),

                )

              }

            >

              <WhatsAppIcon size={18} />

              {t('product.buyWhatsapp')}

            </Button>

          </div>



          {specEntries.length > 0 ? (

            <div className="mt-8 overflow-hidden rounded-2xl border border-mist/70">

              <h2 className="bg-paper px-4 py-3 font-display text-lg font-semibold">

                {t('product.specs')}

              </h2>

              <dl>

                {specEntries.map((spec, index) => (

                  <div

                    key={index}

                    className="grid grid-cols-1 gap-1 border-t border-mist px-4 py-3 text-sm sm:grid-cols-2 sm:gap-3"

                  >

                    <dt className="text-muted">{localized(spec.label, locale)}</dt>

                    <dd className="min-w-0 font-medium break-words">

                      {localized(spec.value, locale)}

                    </dd>

                  </div>

                ))}

              </dl>

            </div>

          ) : null}

        </div>

      </div>



      {related.length > 0 && (

        <div className="mt-16">

          <h2 className="mb-6 font-display text-2xl font-bold">{t('product.related')}</h2>

          <ProductGrid products={related} />

        </div>

      )}

    </section>

  )

}

