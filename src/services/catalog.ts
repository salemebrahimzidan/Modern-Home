import { FALLBACK_IMAGE } from '../utils/images'
import { supabase } from '../lib/supabase'
import { attachImageUrls } from './productImages'
import type { Locale } from '../i18n/types'
import { localized } from '../i18n/types'
import { translate } from '../i18n/translate'
import type { Category } from '../types/category'
import type {
  Product,
  ProductFilters,
  ProductImage,
  ProductSortOption,
  ProductSpec,
  ProductVariant,
} from '../types/product'

interface CategoryRow {
  id: string
  slug: string
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  image_url: string | null
  sort_order: number
}

interface ImageRow {
  id: string
  image_url: string
  alt_ar: string | null
  is_primary: boolean
  sort_order: number
}

interface SpecRow {
  label_ar: string
  label_en: string
  value_ar: string
  value_en: string
  sort_order: number
}

interface VariantRow {
  id: string
  color: string
  size: string
  sku: string | null
  price_egp: number | string | null
  stock_quantity: number
  is_active: boolean
}

interface ProductRow {
  id: string
  category_id: string
  slug: string
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  price_egp: number | string
  compare_at_price_egp: number | string | null
  is_featured: boolean
  is_visible: boolean
  is_new: boolean
  is_best_seller: boolean
  rating: number | string | null
  reviews_count: number
  created_at: string
  product_images: ImageRow[] | null
  product_specifications: SpecRow[] | null
  product_variants: VariantRow[] | null
}

function money(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

function mapVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    color: row.color,
    size: row.size,
    sku: row.sku,
    price: money(row.price_egp),
    stock: row.stock_quantity,
    active: row.is_active,
  }
}

export function variantUnitPrice(basePrice: number, variant: ProductVariant): number {
  return variant.price ?? basePrice
}

export function activeVariants(product: Product): ProductVariant[] {
  return product.variants.filter((variant) => variant.active)
}

function mapProduct(row: ProductRow): Product {
  const basePrice = money(row.price_egp) ?? 0
  const variants = (row.product_variants ?? []).map(mapVariant)
  const sellable = variants.filter((variant) => variant.active)
  const prices = sellable.map((variant) => variantUnitPrice(basePrice, variant))
  const price = prices.length > 0 ? Math.min(...prices) : basePrice
  const oldPrice = money(row.compare_at_price_egp)
  const images = [...(row.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  )
  const gallery: ProductImage[] = images.map((image) => ({
    id: image.id,
    path: image.image_url,
    url: image.image_url,
    primary: image.is_primary,
    sortOrder: image.sort_order,
    color: image.alt_ar?.trim() ?? '',
  }))
  const readyUrls = gallery
    .map((image) => image.url)
    .filter((url) => url.startsWith('https://') || url.startsWith('http://'))
  const specifications: ProductSpec[] = [...(row.product_specifications ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((spec) => ({
      label: { ar: spec.label_ar, en: spec.label_en },
      value: { ar: spec.value_ar, en: spec.value_en },
    }))

  return {
    id: row.id,
    name: { ar: row.name_ar, en: row.name_en },
    slug: row.slug,
    description: { ar: row.description_ar, en: row.description_en },
    price,
    basePrice,
    oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
    categoryId: row.category_id,
    image: readyUrls[0] ?? FALLBACK_IMAGE,
    images: readyUrls.length > 0 ? readyUrls : [FALLBACK_IMAGE],
    gallery,
    discount:
      oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : undefined,
    featured: row.is_featured,
    isVisible: row.is_visible,
    isNew: row.is_new,
    isBestSeller: row.is_best_seller,
    stock: sellable.reduce((sum, variant) => sum + variant.stock, 0),
    rating: money(row.rating) ?? undefined,
    reviewsCount: row.reviews_count,
    colors: [...new Set(sellable.map((variant) => variant.color))],
    sizes: [...new Set(sellable.map((variant) => variant.size))],
    specifications,
    variants,
    createdAt: row.created_at,
  }
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: { ar: row.name_ar, en: row.name_en },
    description:
      row.description_ar || row.description_en
        ? { ar: row.description_ar, en: row.description_en }
        : undefined,
    image: row.image_url || FALLBACK_IMAGE,
  }
}

const productSelect = `
  id, category_id, slug, name_ar, name_en, description_ar, description_en,
  price_egp, compare_at_price_egp, is_featured, is_visible, is_new, is_best_seller,
  rating, reviews_count, created_at,
  product_images ( id, image_url, alt_ar, is_primary, sort_order ),
  product_specifications ( label_ar, label_en, value_ar, value_en, sort_order ),
  product_variants ( id, color, size, sku, price_egp, stock_quantity, is_active )
`

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name_ar, name_en, description_ar, description_en, image_url, sort_order')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return ((data ?? []) as CategoryRow[]).map(mapCategory)
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .order('created_at', { ascending: false })

  if (error) throw error
  return attachImageUrls(((data ?? []) as ProductRow[]).map(mapProduct))
}

export function getCategoryBySlug(
  categories: Category[],
  slug: string,
): Category | undefined {
  return categories.find((category) => category.slug === slug)
}

export function getCategoryName(
  categories: Category[],
  categoryId: string,
  locale: Locale = 'ar',
): string {
  const category = categories.find((item) => item.id === categoryId)
  if (!category) return translate(locale, 'common.unknownCategory')
  return localized(category.name, locale)
}

function matchesSearch(product: Product, categories: Category[], q: string): boolean {
  const category = categories.find((item) => item.id === product.categoryId)
  const haystack = [
    product.name.ar,
    product.name.en,
    product.description.ar,
    product.description.en,
    product.slug,
    ...product.colors,
    ...product.sizes,
    category?.name.ar,
    category?.name.en,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

export function filterAndSortProducts(
  allProducts: Product[],
  categories: Category[],
  filters: ProductFilters,
): Product[] {
  let result = [...allProducts]

  if (filters.material) {
    result = result.filter((product) =>
      product.specifications?.some(
        (spec) => spec.label.en === 'Material' && spec.value.en === filters.material,
      ),
    )
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    result = result.filter((product) => matchesSearch(product, categories, q))
  }

  if (filters.categorySlug) {
    const category = getCategoryBySlug(categories, filters.categorySlug)
    if (category) {
      result = result.filter((product) => product.categoryId === category.id)
    } else {
      result = []
    }
  }

  if (typeof filters.minPrice === 'number' && !Number.isNaN(filters.minPrice)) {
    result = result.filter((product) => product.price >= filters.minPrice!)
  }

  if (typeof filters.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)) {
    result = result.filter((product) => product.price <= filters.maxPrice!)
  }

  const sort: ProductSortOption = filters.sort ?? 'newest'
  switch (sort) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      result.sort((a, b) => b.price - a.price)
      break
    case 'featured':
      result.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt),
      )
      break
    case 'bestsellers':
      result.sort(
        (a, b) =>
          Number(b.isBestSeller) - Number(a.isBestSeller) ||
          (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0),
      )
      break
    case 'newest':
    default:
      result.sort(
        (a, b) => Number(b.isNew) - Number(a.isNew) || b.createdAt.localeCompare(a.createdAt),
      )
      break
  }

  return result
}

export function getFeaturedProducts(products: Product[], limit = 8): Product[] {
  return products.filter((product) => product.featured).slice(0, limit)
}

export function getNewProducts(products: Product[], limit = 8): Product[] {
  return products.filter((product) => product.isNew).slice(0, limit)
}

export function getBestSellerProducts(products: Product[], limit = 8): Product[] {
  return products.filter((product) => product.isBestSeller).slice(0, limit)
}

export function getOfferProducts(products: Product[], limit?: number): Product[] {
  const offers = products.filter((product) => product.oldPrice && product.oldPrice > product.price)
  return typeof limit === 'number' ? offers.slice(0, limit) : offers
}

export function getRelatedProducts(products: Product[], product: Product, limit = 4): Product[] {
  return products
    .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
    .slice(0, limit)
}

export function getPriceBounds(allProducts: Product[]): { min: number; max: number } {
  if (allProducts.length === 0) return { min: 0, max: 0 }
  const prices = allProducts.map((product) => product.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

export function findVariant(product: Product, variantId: string): ProductVariant | undefined {
  return product.variants.find((variant) => variant.id === variantId && variant.active)
}

export function defaultVariant(product: Product): ProductVariant | undefined {
  const sellable = activeVariants(product)
  return sellable.find((variant) => variant.stock > 0) ?? sellable[0]
}
