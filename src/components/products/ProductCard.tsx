import { Eye, MessageCircle, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { getCategoryName } from '../../services/catalog'
import type { Product } from '../../types/product'
import { FALLBACK_IMAGE } from '../../utils/images'
import { formatCurrency } from '../../utils/currency'
import { getProductDiscount, getProductPath } from '../../utils/product'
import { buildProductInquiryMessage, openWhatsApp } from '../../utils/whatsapp'
import Button from '../common/Button'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const discount = getProductDiscount(product)
  const detailsPath = getProductPath(product)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link to={detailsPath} className="relative block overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="aspect-[4/5] w-full bg-mist object-cover object-center transition duration-500 group-hover:scale-[1.04]"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE
          }}
        />
        <div className="absolute start-3 top-3 flex flex-col gap-2">
          {discount ? (
            <span className="rounded-full bg-warn px-2.5 py-1 text-xs font-semibold text-white">
              خصم {discount}%
            </span>
          ) : null}
          {product.isNew ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
              جديد
            </span>
          ) : null}
          {product.isBestSeller ? (
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
              الأكثر مبيعاً
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs text-muted">{getCategoryName(product.categoryId)}</p>
          <Link to={detailsPath}>
            <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold leading-7 text-ink hover:text-accent">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto flex items-end gap-2">
          <span className="text-lg font-bold text-accent">{formatCurrency(product.price)}</span>
          {product.oldPrice && product.oldPrice > product.price ? (
            <span className="text-sm text-muted line-through">
              {formatCurrency(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={() => addToCart(product)}
            aria-label={`أضف ${product.name} إلى السلة`}
          >
            <ShoppingCart size={15} />
            أضف
          </Button>
          <Link to={detailsPath}>
            <Button size="sm" variant="outline" fullWidth>
              <Eye size={15} />
              التفاصيل
            </Button>
          </Link>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-[#128C7E]"
          onClick={() =>
            openWhatsApp(buildProductInquiryMessage(product.name, product.price))
          }
        >
          <MessageCircle size={15} />
          اطلب عبر واتساب
        </Button>
      </div>
    </article>
  )
}
