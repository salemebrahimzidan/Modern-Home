import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem } from '../types/cart'
import type { Product } from '../types/product'
import { getStorageItem, setStorageItem } from '../utils/storage'
import { useToast } from './ToastContext'

const CART_STORAGE_KEY = 'modern-home-kitchen-cart'

export interface CartContextValue {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: number) => void
  increaseQuantity: (productId: number) => void
  decreaseQuantity: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemsCount: () => number
}

export const CartContext = createContext<CartContextValue | null>(null)

function normalizeCart(items: CartItem[]): CartItem[] {
  return items
    .filter(
      (item) =>
        item &&
        item.product &&
        typeof item.product.id === 'number' &&
        typeof item.product.slug === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    )
    .map((item) => ({
      product: item.product,
      quantity: Math.min(item.quantity, Math.max(item.product.stock, 1)),
    }))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [items, setItems] = useState<CartItem[]>(() =>
    normalizeCart(getStorageItem<CartItem[]>(CART_STORAGE_KEY, [])),
  )

  useEffect(() => {
    setStorageItem(CART_STORAGE_KEY, items)
  }, [items])

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (product.stock <= 0) {
        showToast('هذا المنتج غير متوفر حالياً', 'error')
        return
      }

      setItems((current) => {
        const existing = current.find((item) => item.product.id === product.id)
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, product.stock)
          return current.map((item) =>
            item.product.id === product.id ? { ...item, quantity: nextQty } : item,
          )
        }
        return [...current, { product, quantity: Math.min(quantity, product.stock) }]
      })
      showToast('تمت إضافة المنتج إلى السلة')
    },
    [showToast],
  )

  const removeFromCart = useCallback(
    (productId: number) => {
      setItems((current) => current.filter((item) => item.product.id !== productId))
      showToast('تم حذف المنتج من السلة', 'info')
    },
    [showToast],
  )

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((current) => {
      if (quantity < 1) {
        return current.filter((item) => item.product.id !== productId)
      }
      return current.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(quantity, Math.max(item.product.stock, 1)),
            }
          : item,
      )
    })
  }, [])

  const increaseQuantity = useCallback(
    (productId: number) => {
      setItems((current) =>
        current.map((item) => {
          if (item.product.id !== productId) return item
          if (item.quantity >= item.product.stock) return item
          return { ...item, quantity: item.quantity + 1 }
        }),
      )
    },
    [],
  )

  const decreaseQuantity = useCallback((productId: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const getCartTotal = useCallback(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  )

  const getCartItemsCount = useCallback(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemsCount,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemsCount,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
