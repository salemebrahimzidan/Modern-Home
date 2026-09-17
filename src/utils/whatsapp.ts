import { storeConfig } from '../config/store'
import type { OrderCustomer, OrderPayload } from '../types/order'
import type { CartItem } from '../types/cart'
import { formatCurrency } from './currency'

export function buildOrderPayload(
  customer: OrderCustomer,
  items: CartItem[],
): OrderPayload {
  const lines = items.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    price: item.product.price,
    lineTotal: item.product.price * item.quantity,
  }))

  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0)

  return { customer, items: lines, total }
}

export function buildWhatsAppOrderMessage(payload: OrderPayload): string {
  const productLines = payload.items
    .map(
      (item) =>
        `- ${item.name} × ${item.quantity} — ${formatCurrency(item.lineTotal)}`,
    )
    .join('\n')

  const notes = payload.customer.notes?.trim()
    ? `\nالملاحظات:\n${payload.customer.notes.trim()}`
    : ''

  return `مرحباً، أريد عمل طلب جديد.

بيانات العميل:
الاسم: ${payload.customer.name}
رقم الهاتف: ${payload.customer.phone}
العنوان: ${payload.customer.address}

المنتجات:
${productLines}

الإجمالي: ${formatCurrency(payload.total)}${notes}`
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

export function buildProductInquiryMessage(productName: string, price: number): string {
  return `السلام عليكم، أود الاستفسار عن المنتج التالي:
${productName}
السعر: ${formatCurrency(price)}`
}
