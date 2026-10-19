import { supabase } from '../lib/supabase'

export type StorePaymentMethod = 'cod' | 'vodafone_cash'

export interface DeliveryInput {
  recipientName: string
  phone: string
  governorate: string
  city: string
  street: string
  notes: string
}

export interface StoreOrderItem {
  id: string
  nameAr: string
  nameEn: string
  color: string
  size: string
  sku: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface StoreOrderEvent {
  id: string
  toStatus: string
  message: string
  createdAt: string
}

export interface StoreOrder {
  id: string
  reference: string
  status: string
  paymentMethod: StorePaymentMethod
  total: number
  createdAt: string
  recipientName: string
  recipientPhone: string
  street: string
  city: string
  governorate: string
  items: StoreOrderItem[]
  events: StoreOrderEvent[]
  paymentStatus: string | null
  transferReference: string | null
}

interface OrderItemRow {
  id: string
  product_name_ar: string
  product_name_en: string
  color: string
  size: string
  sku: string | null
  unit_price_egp: number | string
  quantity: number
  line_total_egp: number | string
}

interface EventRow {
  id: string
  to_status: string
  customer_message: string
  created_at: string
}

interface PaymentRow {
  status: string
  transfer_reference: string | null
}

interface OrderRow {
  id: string
  reference: string
  status: string
  payment_method: StorePaymentMethod
  total_egp: number | string
  created_at: string
  recipient_name: string
  recipient_phone: string
  delivery_street: string
  delivery_city: string
  delivery_governorate: string
  order_items: OrderItemRow[] | null
  order_status_events: EventRow[] | null
  payments: PaymentRow | PaymentRow[] | null
}

function mapOrder(row: OrderRow): StoreOrder {
  const payment = Array.isArray(row.payments) ? row.payments[0] : row.payments
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    paymentMethod: row.payment_method,
    total: Number(row.total_egp),
    createdAt: row.created_at,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    street: row.delivery_street,
    city: row.delivery_city,
    governorate: row.delivery_governorate,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      nameAr: item.product_name_ar,
      nameEn: item.product_name_en,
      color: item.color,
      size: item.size,
      sku: item.sku,
      unitPrice: Number(item.unit_price_egp),
      quantity: item.quantity,
      lineTotal: Number(item.line_total_egp),
    })),
    events: [...(row.order_status_events ?? [])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((event) => ({
        id: event.id,
        toStatus: event.to_status,
        message: event.customer_message,
        createdAt: event.created_at,
      })),
    paymentStatus: payment?.status ?? null,
    transferReference: payment?.transfer_reference ?? null,
  }
}

const orderSelect = `
  id, reference, status, payment_method, total_egp, created_at,
  recipient_name, recipient_phone, delivery_street, delivery_city, delivery_governorate,
  order_items ( id, product_name_ar, product_name_en, color, size, sku, unit_price_egp, quantity, line_total_egp ),
  order_status_events ( id, to_status, customer_message, created_at ),
  payments ( status, transfer_reference )
`

export async function fetchMyOrders(): Promise<StoreOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(orderSelect)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as OrderRow[]).map(mapOrder)
}

export async function fetchOrder(orderId: string): Promise<StoreOrder | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(orderSelect)
    .eq('id', orderId)
    .maybeSingle()

  if (error) throw error
  return data ? mapOrder(data as OrderRow) : null
}

export async function createAddress(userId: string, input: DeliveryInput): Promise<string> {
  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: userId,
      recipient_name: input.recipientName.trim(),
      phone: input.phone.trim(),
      governorate: input.governorate.trim(),
      city: input.city.trim(),
      street: input.street.trim(),
      notes: input.notes.trim(),
      is_default: true,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function placeOrder(input: {
  addressId: string
  method: StorePaymentMethod
  idempotencyKey: string
  note: string
}): Promise<string> {
  const { data, error } = await supabase.rpc('checkout_order', {
    p_address_id: input.addressId,
    p_payment_method: input.method,
    p_idempotency_key: input.idempotencyKey,
    p_customer_note: input.note,
  })

  if (error) throw error
  return data as string
}

export async function submitVodafoneProof(
  orderId: string,
  senderPhone: string,
  transferReference: string,
): Promise<void> {
  const { error } = await supabase.rpc('submit_vodafone_cash_proof', {
    p_order_id: orderId,
    p_sender_phone: senderPhone,
    p_transfer_reference: transferReference,
  })
  if (error) throw error
}
