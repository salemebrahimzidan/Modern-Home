import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import type { CartItem as CartItemType } from '../../types/cart'
import { formatCurrency } from '../../utils/currency'
import { FALLBACK_IMAGE } from '../../utils/images'
import { getProductPath } from '../../utils/product'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart()
  const { locale, t } = useLocale()
  const name = localized(item.product.name, locale)
  const lineTotal = item.unitPrice * item.quantity

  return (
    <tr className="border-t border-[#eef2f6] even:bg-[#f6f8fa]">
      <td className="px-4 py-3">
        <Link to={getProductPath(item.product)} className="flex items-center gap-3 font-medium text-[#121826] hover:text-accent">
          <img
            src={item.product.image}
            alt=""
            className="size-11 shrink-0 rounded-lg object-cover"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE
            }}
          />
          <span className="line-clamp-2">{name}</span>
        </Link>
      </td>
      <td className="px-4 py-3 text-[#344054]">{item.size || '—'}</td>
      <td className="px-4 py-3 text-[#344054]">{item.color || '—'}</td>
      <td className="whitespace-nowrap px-4 py-3 text-[#344054]">{formatCurrency(item.unitPrice, locale)}</td>
      <td className="px-4 py-3">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            className="grid size-7 place-items-center rounded-lg bg-[#e8f7ee] text-[#178a45]"
            onClick={() => decreaseQuantity(item.variantId)}
            aria-label={t('product.decreaseQty')}
          >
            <Minus size={13} />
          </button>
          <span className="min-w-6 text-center text-sm font-semibold text-[#121826]">{item.quantity}</span>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-lg bg-[#e8f7ee] text-[#178a45] disabled:opacity-40"
            onClick={() => increaseQuantity(item.variantId)}
            aria-label={t('product.increaseQty')}
            disabled={item.quantity >= item.stock}
          >
            <Plus size={13} />
          </button>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-medium text-[#121826]">{formatCurrency(lineTotal, locale)}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => removeFromCart(item.variantId)}
          className="grid size-8 place-items-center rounded-lg bg-[#fff1f2] text-[#e11d48] transition hover:bg-[#ffe4e6]"
          aria-label={t('product.removeAria', { name })}
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  )
}
