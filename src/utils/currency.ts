import { storeConfig } from '../config/store'
import type { Locale } from '../i18n/types'
import { localized } from '../i18n/types'

const numberLocales: Record<Locale, string> = {
  ar: 'ar-EG',
  en: 'en-EG',
}

export function formatCurrency(amount: number, locale: Locale = 'ar'): string {
  return `${amount.toLocaleString(numberLocales[locale])} ${localized(storeConfig.currencyLabel, locale)}`
}

/** Western digits so order files and WhatsApp totals match the checkout template. */
export function formatOrderAmount(amount: number, locale: Locale = 'ar'): string {
  return `${amount.toLocaleString('en-US')} ${localized(storeConfig.currencyLabel, locale)}`
}

export function formatOrderNumber(amount: number): string {
  return amount.toLocaleString('en-US')
}

export function calcDiscountPercent(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null
  return Math.round(((oldPrice - price) / oldPrice) * 100)
}
