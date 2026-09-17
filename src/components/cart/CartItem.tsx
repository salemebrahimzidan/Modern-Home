import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import type { CartItem as CartItemType } from '../../types/cart'
import { FALLBACK_IMAGE } from '../../utils/images'
import { formatCurrency } from '../../utils/currency'
import { getProductPath } from '../../utils/product'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart()

  return (
    <li className="flex gap-3 border-b border-mist py-4 last:border-b-0 sm:gap-4">
      <Link to={getProductPath(item.product)} className="shrink-0">
        <img
          src={item.product.image}
          alt={item.product.name}
          className="h-24 w-20 rounded-xl object-cover sm:h-28 sm:w-24"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE
          }}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={getProductPath(item.product)}
            className="font-display text-base font-semibold hover:text-accent"
          >
            {item.product.name}
          </Link>
          <button
            type="button"
            onClick={() => removeFromCart(item.product.id)}
            className="rounded-lg p-2 text-muted hover:bg-mist hover:text-danger"
            aria-label={`حذف ${item.product.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <p className="text-sm text-accent font-semibold">
          {formatCurrency(item.product.price)}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <div className="inline-flex items-center rounded-xl border border-mist">
            <button
              type="button"
              className="p-2 hover:bg-mist"
              onClick={() => decreaseQuantity(item.product.id)}
              aria-label="تقليل الكمية"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="p-2 hover:bg-mist"
              onClick={() => increaseQuantity(item.product.id)}
              aria-label="زيادة الكمية"
              disabled={item.quantity >= item.product.stock}
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-sm font-semibold">
            {formatCurrency(item.product.price * item.quantity)}
          </p>
        </div>
      </div>
    </li>
  )
}
