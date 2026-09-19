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
  const lineTotal = item.product.price * item.quantity

  return (
    <li className="flex gap-3 border-b border-dashed border-mist py-4 last:border-b-0">
      <Link to={getProductPath(item.product)} className="shrink-0">
        <img
          src={item.product.image}
          alt={name}
          className="h-16 w-16 rounded-xl object-cover ring-1 ring-mist/80 sm:h-[4.5rem] sm:w-[4.5rem]"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE
          }}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start gap-2">
          <Link
            to={getProductPath(item.product)}
            className="min-w-0 flex-1 font-display text-sm font-semibold leading-5 hover:text-accent"
          >
            <span className="line-clamp-2">{name}</span>
          </Link>
          <button
            type="button"
            onClick={() => removeFromCart(item.product.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger transition hover:bg-danger hover:text-white"
            aria-label={t('product.removeAria', { name })}
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex h-8 items-center overflow-hidden rounded-lg bg-accent-soft">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-accent hover:bg-accent hover:text-white"
              onClick={() => decreaseQuantity(item.product.id)}
              aria-label={t('product.decreaseQty')}
            >
              <Minus size={13} />
            </button>
            <span className="min-w-7 text-center text-sm font-semibold text-ink">{item.quantity}</span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-accent hover:bg-accent hover:text-white disabled:opacity-40"
              onClick={() => increaseQuantity(item.product.id)}
              aria-label={t('product.increaseQty')}
              disabled={item.quantity >= item.product.stock}
            >
              <Plus size={13} />
            </button>
          </div>
          <p className="rounded-lg bg-accent px-2.5 py-1 text-sm font-bold text-white">
            {formatCurrency(lineTotal, locale)}
          </p>
        </div>
      </div>
    </li>
  )
}
