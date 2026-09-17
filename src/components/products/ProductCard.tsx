import { Eye, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useLocale } from '../../hooks/useLocale'
import { getCategoryName } from '../../services/catalog'
import type { Product } from '../../types/product'
import { localized } from '../../i18n/types'
import { FALLBACK_IMAGE } from '../../utils/images'
import { formatCurrency } from '../../utils/currency'
import { getProductDiscount, getProductPath } from '../../utils/product'
import { buildProductInquiryMessage, openWhatsApp } from '../../utils/whatsapp'
import Button from '../common/Button'
import WhatsAppIcon from '../common/WhatsAppIcon'

interface ProductCardProps {
  product: Product
}

const iconAction =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-medium transition @[13rem]:size-10 @[16rem]:h-10 @[16rem]:w-full @[16rem]:gap-1.5 @[16rem]:px-2 @[16rem]:text-sm'

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const { locale, t } = useLocale()
  const discount = getProductDiscount(product)
  const detailsPath = getProductPath(product)
  const name = localized(product.name, locale)

  return (
    <article className="@container group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-soft">
      <Link to={detailsPath} className="relative block overflow-hidden bg-mist">
        <img
          src={product.image}
          alt={name}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-ink/25 to-transparent opacity-80 @[16rem]:h-16" />
        <div className="absolute start-2 top-2 flex max-w-[calc(100%-1rem)] flex-col gap-1 @[16rem]:start-3 @[16rem]:top-3 @[16rem]:gap-1.5">
          {discount ? (
            <span className="w-fit rounded-full bg-warn px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm @[16rem]:px-2.5 @[16rem]:py-1 @[16rem]:text-xs">
              {t('common.discount', { percent: discount })}
            </span>
          ) : null}
          {product.isNew ? (
            <span className="w-fit rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm @[16rem]:px-2.5 @[16rem]:py-1 @[16rem]:text-xs">
              {t('common.new')}
            </span>
          ) : null}
          {product.isBestSeller ? (
            <span className="w-fit rounded-full bg-ink/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm @[16rem]:px-2.5 @[16rem]:py-1 @[16rem]:text-xs">
              <span className="@[16rem]:hidden">{t('common.bestSellerShort')}</span>
              <span className="hidden @[16rem]:inline">{t('common.bestSeller')}</span>
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-2.5 @[16rem]:gap-3.5 @[16rem]:p-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-muted @[16rem]:text-xs">
            {getCategoryName(product.categoryId, locale)}
          </p>
          <Link to={detailsPath} className="mt-1 block">
            <h3 className="line-clamp-2 min-h-[2.4rem] font-display text-[13px] font-semibold leading-snug text-ink transition group-hover:text-accent @[16rem]:min-h-[3.25rem] @[16rem]:text-base @[16rem]:leading-7">
              {name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto flex min-w-0 flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-bold tracking-tight text-accent @[16rem]:text-lg">
            {formatCurrency(product.price, locale)}
          </span>
          {product.oldPrice && product.oldPrice > product.price ? (
            <span className="text-[11px] text-muted line-through @[16rem]:text-sm">
              {formatCurrency(product.oldPrice, locale)}
            </span>
          ) : null}
        </div>

        <div className="flex items-stretch gap-1.5 @[16rem]:flex-col @[16rem]:gap-2">
          <Button
            size="sm"
            className="h-9 min-w-0 flex-1 gap-1 px-1.5 text-xs @[13rem]:h-10 @[13rem]:px-2 @[16rem]:w-full @[16rem]:gap-2 @[16rem]:px-3 @[16rem]:text-sm"
            onClick={() => addToCart(product)}
            aria-label={t('product.addAria', { name })}
          >
            <ShoppingCart size={15} className="shrink-0" />
            <span className="hidden truncate @[16rem]:inline">{t('common.addToCart')}</span>
          </Button>

          <div className="flex shrink-0 gap-1.5 @[16rem]:grid @[16rem]:w-full @[16rem]:grid-cols-2 @[16rem]:gap-2">
            <Link
              to={detailsPath}
              aria-label={t('product.detailsAria', { name })}
              title={t('common.details')}
              className={`${iconAction} border border-mist bg-surface text-ink hover:border-accent hover:bg-accent-soft hover:text-accent`}
            >
              <Eye size={16} className="shrink-0" />
              <span className="hidden truncate @[16rem]:inline">{t('common.details')}</span>
            </Link>
            <button
              type="button"
              title={t('common.whatsapp')}
              className={`${iconAction} border border-[#25D366]/35 bg-[#25D366]/10 text-[#0f7660] hover:border-[#25D366]/55 hover:bg-[#25D366]/18`}
              onClick={() =>
                openWhatsApp(buildProductInquiryMessage(name, product.price, locale))
              }
              aria-label={t('product.whatsappAria', { name })}
            >
              <WhatsAppIcon size={16} />
              <span className="hidden truncate @[16rem]:inline">{t('common.whatsapp')}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
