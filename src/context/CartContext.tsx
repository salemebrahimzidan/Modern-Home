import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocale } from '../hooks/useLocale'
import { fetchRemoteCart, lineFromProduct, writeRemoteLine } from '../services/cartSync'
import { defaultVariant } from '../services/catalog'
import type { CartItem } from '../types/cart'
import type { Product } from '../types/product'
import { getStorageItem, setStorageItem } from '../utils/storage'
import { useAuth } from './AuthContext'
import { useCatalog } from './CatalogContext'
import { useToast } from './ToastContext'

const CART_STORAGE_KEY = 'modern-home-kitchen-cart'

export interface CartContextValue {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number, variantId?: string) => void
  removeFromCart: (variantId: string) => void
  increaseQuantity: (variantId: string) => void
  decreaseQuantity: (variantId: string) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemsCount: () => number
}

export const CartContext = createContext<CartContextValue | null>(null)

function isStoredLine(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const line = value as CartItem
  return (
    typeof line.variantId === 'string' &&
    typeof line.quantity === 'number' &&
    line.quantity > 0 &&
    !!line.product &&
    typeof line.product.id === 'string'
  )
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const { t } = useLocale()
  const { session } = useAuth()
  const { products, ready } = useCatalog()
  const [items, setItems] = useState<CartItem[]>(() =>
    getStorageItem<unknown[]>(CART_STORAGE_KEY, []).filter(isStoredLine),
  )
  const itemsRef = useRef(items)
  const mergedFor = useRef<string | null>(null)
  const previousUser = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    itemsRef.current = items
    if (!session) setStorageItem(CART_STORAGE_KEY, items)
  }, [items, session])

  useEffect(() => {
    const userId = session?.user.id ?? null
    if (previousUser.current && !userId) {
      setItems([])
      mergedFor.current = null
    }
    previousUser.current = userId
  }, [session])

  useEffect(() => {
    if (!ready) return
    setItems((current) =>
      current
        .map((item) => {
          const product = products.find((entry) => entry.id === item.product.id) ?? item.product
          return lineFromProduct(product, item.variantId, item.quantity) ?? item
        })
        .filter((item) => item.product.variants.some((variant) => variant.id === item.variantId)),
    )
  }, [products, ready])

  useEffect(() => {
    const userId = session?.user.id
    if (!userId || !ready || mergedFor.current === userId) return
    mergedFor.current = userId
    const local = itemsRef.current
    let active = true

    void (async () => {
      try {
        for (const item of local) {
          await writeRemoteLine(userId, item.variantId, item.quantity)
        }
        const remote = await fetchRemoteCart(userId, products)
        if (active) setItems(remote)
      } catch {
        if (active) showToast(t('cart.syncFailed'), 'error')
      }
    })()

    return () => {
      active = false
    }
  }, [products, ready, session, showToast, t])

  const persist = useCallback(
    (variantId: string, quantity: number) => {
      const userId = session?.user.id
      if (!userId) return
      void writeRemoteLine(userId, variantId, quantity).catch(() => {
        showToast(t('cart.syncFailed'), 'error')
      })
    },
    [session, showToast, t],
  )

  const addToCart = useCallback(
    (product: Product, quantity = 1, variantId?: string) => {
      const variant = variantId
        ? product.variants.find((item) => item.id === variantId && item.active)
        : defaultVariant(product)
      if (!variant || variant.stock <= 0) {
        showToast(t('cart.unavailable'), 'error')
        return
      }

      const line = lineFromProduct(product, variant.id, Math.min(quantity, variant.stock))
      if (!line) return

      setItems((current) => {
        const existing = current.find((item) => item.variantId === variant.id)
        const nextQty = Math.min((existing?.quantity ?? 0) + line.quantity, variant.stock)
        persist(variant.id, nextQty)
        if (existing) {
          return current.map((item) =>
            item.variantId === variant.id ? { ...line, quantity: nextQty } : item,
          )
        }
        return [...current, line]
      })
      showToast(t('cart.added'))
    },
    [persist, showToast, t],
  )

  const removeFromCart = useCallback(
    (variantId: string) => {
      setItems((current) => current.filter((item) => item.variantId !== variantId))
      persist(variantId, 0)
      showToast(t('cart.removed'), 'info')
    },
    [persist, showToast, t],
  )

  const increaseQuantity = useCallback(
    (variantId: string) => {
      setItems((current) =>
        current.map((item) => {
          if (item.variantId !== variantId || item.quantity >= item.stock) return item
          const quantity = item.quantity + 1
          persist(variantId, quantity)
          return { ...item, quantity }
        }),
      )
    },
    [persist],
  )

  const decreaseQuantity = useCallback(
    (variantId: string) => {
      setItems((current) =>
        current
          .map((item) => {
            if (item.variantId !== variantId) return item
            const quantity = item.quantity - 1
            persist(variantId, quantity)
            return { ...item, quantity }
          })
          .filter((item) => item.quantity > 0),
      )
    },
    [persist],
  )

  const clearCart = useCallback(() => {
    const current = itemsRef.current
    setItems([])
    for (const item of current) persist(item.variantId, 0)
  }, [persist])

  const getCartTotal = useCallback(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
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
      clearCart,
      getCartTotal,
      getCartItemsCount,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
