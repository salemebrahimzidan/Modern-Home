import type { Product } from './product'

export interface CartItem {
  product: Product
  variantId: string
  color: string
  size: string
  unitPrice: number
  stock: number
  quantity: number
}

export interface CartState {
  items: CartItem[]
}
