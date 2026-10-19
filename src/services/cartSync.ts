import { supabase } from '../lib/supabase'
import { variantUnitPrice } from './catalog'
import type { CartItem } from '../types/cart'
import type { Product } from '../types/product'

async function ownCartId(userId: string): Promise<string> {
  const existing = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data?.id) return existing.data.id as string

  const created = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single()

  if (!created.error && created.data?.id) return created.data.id as string

  const again = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle()
  if (again.error || !again.data?.id) throw created.error ?? again.error
  return again.data.id as string
}

export async function fetchRemoteCart(userId: string, products: Product[]): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('variant_id, quantity, carts!inner(user_id)')
    .eq('carts.user_id', userId)

  if (error) throw error

  return ((data ?? []) as Array<{ variant_id: string; quantity: number }>)
    .map((row) => {
      const product = products.find((item) =>
        item.variants.some((variant) => variant.id === row.variant_id),
      )
      const variant = product?.variants.find((item) => item.id === row.variant_id)
      if (!product || !variant || !variant.active) return null
      return {
        product,
        variantId: variant.id,
        color: variant.color,
        size: variant.size,
        unitPrice: variantUnitPrice(product.basePrice, variant),
        stock: variant.stock,
        quantity: row.quantity,
      }
    })
    .filter((item): item is CartItem => item !== null)
}

export async function writeRemoteLine(
  userId: string,
  variantId: string,
  quantity: number,
): Promise<void> {
  const cartId = await ownCartId(userId)
  if (quantity < 1) {
    const removed = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)
    if (removed.error) throw removed.error
    return
  }

  const existing = await supabase
    .from('cart_items')
    .select('id')
    .eq('cart_id', cartId)
    .eq('variant_id', variantId)
    .maybeSingle()
  if (existing.error) throw existing.error

  if (existing.data?.id) {
    const updated = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', existing.data.id)
    if (updated.error) throw updated.error
    return
  }

  const inserted = await supabase
    .from('cart_items')
    .insert({ cart_id: cartId, variant_id: variantId, quantity })
  if (inserted.error) throw inserted.error
}

export function lineFromProduct(
  product: Product,
  variantId: string,
  quantity: number,
): CartItem | null {
  const variant = product.variants.find((item) => item.id === variantId && item.active)
  if (!variant) return null
  return {
    product,
    variantId: variant.id,
    color: variant.color,
    size: variant.size,
    unitPrice: variantUnitPrice(product.basePrice, variant),
    stock: variant.stock,
    quantity,
  }
}
