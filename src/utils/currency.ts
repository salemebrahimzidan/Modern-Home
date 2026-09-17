import { storeConfig } from '../config/store'

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ${storeConfig.currencyLabel}`
}

export function calcDiscountPercent(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null
  return Math.round(((oldPrice - price) / oldPrice) * 100)
}
