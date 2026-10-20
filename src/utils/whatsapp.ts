import { storeConfig } from '../config/store'
import type { Locale } from '../i18n/types'
import { localized } from '../i18n/types'
import type { OrderCustomer, OrderPayload } from '../types/order'
import type { CartItem } from '../types/cart'
import { formatOrderAmount } from './currency'

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
  const ar = locale === 'ar'
  const productLines = payload.items
    .map(
      (item) =>
        `• ${item.name} × ${item.quantity} — ${formatOrderAmount(item.lineTotal, locale)}`,
    )
    .join('\n')

  const deliveryLines = [
    `${ar ? 'الاسم' : 'Name'}: ${payload.customer.name.trim()}`,
    `${ar ? 'الهاتف' : 'Phone'}: ${payload.customer.phone.trim()}`,
    `${ar ? 'العنوان' : 'Address'}: ${payload.customer.address.trim()}`,
  ]
  const notes = payload.customer.notes?.trim()
  if (notes) {
    deliveryLines.push('', `*${ar ? 'ملاحظات' : 'Notes'}*`, notes)
  }

  const subtotal = formatOrderAmount(payload.total, locale)

  return [
    ar
      ? 'مرحباً مودرن هوم 👋\nأرغب في تأكيد الطلب التالي:'
      : 'Hello Modern Home 👋\nI would like to confirm this order:',
    `*${ar ? 'المنتجات' : 'Products'}*\n${productLines}`,
    ar
      ? `*إجمالي المنتجات: ${subtotal}*\nالتوصيل يُحدد حسب العنوان.`
      : `*Products subtotal: ${subtotal}*\nDelivery is determined by the address.`,
    `*${ar ? 'بيانات التوصيل' : 'Delivery details'}*\n${deliveryLines.join('\n')}`,
    ar
      ? 'يرجى تأكيد التوفر والتكلفة النهائية.'
      : 'Please confirm availability and the final cost.',
  ].join('\n\n')
}

export function buildWhatsAppOrderFileMessage(
  reference: string,
  total: number,
  locale: Locale = 'ar',
): string {
  const subtotal = formatOrderAmount(total, locale)
  if (locale === 'ar') {
    return `مرحباً مودرن هوم
أرغب في تأكيد الطلب رقم: ${reference}
إجمالي المنتجات: ${subtotal}
سأرفق ملف الطلب للمراجعة.`
  }

  return `Hello Modern Home
I would like to confirm order number: ${reference}
Products subtotal: ${subtotal}
I will attach the order file for review.`
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
