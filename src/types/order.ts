export interface OrderCustomer {
  name: string
  phone: string
  address: string
  notes?: string
}

export interface OrderLine {
  name: string
  quantity: number
  price: number
  lineTotal: number
}

export interface OrderPayload {
  customer: OrderCustomer
  items: OrderLine[]
  total: number
}
