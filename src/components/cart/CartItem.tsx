import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import type { CartItem as CartItemType } from '../../types/cart'
import { FALLBACK_IMAGE } from '../../utils/images'
import { formatCurrency } from '../../utils/currency'
import { getProductPath } from '../../utils/product'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart()
  const { locale, t } = useLocale()
  const name = localized(item.product.name, locale)

  return (
    <li className="flex gap-2.5 border-b border-mist py-4 last:border-b-0 sm:gap-4">
      <Link to={getProductPath(item.product)} className="shrink-0">
        <img
          src={item.product.image}
          alt={name}
          className="h-20 w-16 rounded-xl object-cover sm:h-28 sm:w-24"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE
          }}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={getProductPath(item.product)}
            className="min-w-0 font-display text-sm font-semibold hover:text-accent sm:text-base"
          >
            <span className="line-clamp-2">{name}</span>
          </Link>
          <button
            type="button"
            onClick={() => removeFromCart(item.product.id)}
            className="rounded-lg p-2 text-muted hover:bg-mist hover:text-danger"
            aria-label={t('product.removeAria', { name })}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <p className="text-sm text-accent font-semibold">
          {formatCurrency(item.product.price, locale)}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-xl border border-mist">
            <button
              type="button"
              className="p-2 hover:bg-mist"
              onClick={() => decreaseQuantity(item.product.id)}
              aria-label={t('product.decreaseQty')}
            >
              <Minus size={14} />
            </button>
            <span className="min-w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="p-2 hover:bg-mist"
              onClick={() => increaseQuantity(item.product.id)}
              aria-label={t('product.increaseQty')}
              disabled={item.quantity >= item.product.stock}
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-sm font-semibold">
            {formatCurrency(item.product.price * item.quantity, locale)}
          </p>
        </div>
      </div>
    </li>
  )
}
