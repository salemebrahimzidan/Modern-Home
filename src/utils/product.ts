import type { Product } from '../types/product'
import { calcDiscountPercent } from './currency'

export function getProductPath(product: Pick<Product, 'slug'>): string {
  return `/products/${product.slug}`
}

export function getProductDiscount(product: Product): number | null {
  return product.discount ?? calcDiscountPercent(product.price, product.oldPrice)
}
