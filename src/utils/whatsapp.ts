import { storeConfig } from '../config/store'
import { translate } from '../i18n/translate'
import type { Locale } from '../i18n/types'
import { localized } from '../i18n/types'
import type { OrderCustomer, OrderPayload } from '../types/order'
import type { CartItem } from '../types/cart'
import { formatCurrency } from './currency'

export function buildOrderPayload(
  customer: OrderCustomer,
  items: CartItem[],
  locale: Locale = 'ar',
): OrderPayload {
  const lines = items.map((item) => ({
    name: localized(item.product.name, locale),
    quantity: item.quantity,
    price: item.product.price,
    lineTotal: item.product.price * item.quantity,
  }))

  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0)

  return { customer, items: lines, total }
}

export function buildWhatsAppOrderMessage(
  payload: OrderPayload,
  locale: Locale = 'ar',
): string {
  const productLines = payload.items
    .map(
      (item) =>
        `- ${item.name} × ${item.quantity} — ${formatCurrency(item.lineTotal, locale)}`,
    )
    .join('\n')

  const notes = payload.customer.notes?.trim()
    ? `\n${translate(locale, 'whatsapp.notes')}\n${payload.customer.notes.trim()}`
    : ''

  return `${translate(locale, 'whatsapp.orderGreeting')}

${translate(locale, 'whatsapp.customerInfo')}
${translate(locale, 'whatsapp.name')}: ${payload.customer.name}
${translate(locale, 'whatsapp.phone')}: ${payload.customer.phone}
${translate(locale, 'whatsapp.address')}: ${payload.customer.address}

${translate(locale, 'whatsapp.products')}
${productLines}

${translate(locale, 'whatsapp.total')}: ${formatCurrency(payload.total, locale)}${notes}`
}

export function buildWhatsAppUrl(message: string, phone = storeConfig.whatsapp): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(message: string, phone = storeConfig.whatsapp): void {
  window.open(buildWhatsAppUrl(message, phone), '_blank', 'noopener,noreferrer')
}

export function openWhatsAppChat(phone = storeConfig.whatsapp): void {
  const digits = phone.replace(/\D/g, '')
  window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer')
}

export function buildProductInquiryMessage(
  productName: string,
  price: number,
  locale: Locale = 'ar',
): string {
  return `${translate(locale, 'whatsapp.inquiry')}
${productName}
${translate(locale, 'whatsapp.price')}: ${formatCurrency(price, locale)}`
}
