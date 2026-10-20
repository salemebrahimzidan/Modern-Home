import type { LocalizedText } from '../i18n/types'

export interface ProductSpec {
  label: LocalizedText
  value: LocalizedText
}

export interface ProductImage {
  id: string
  /** Storage object path, or a legacy https URL. */
  path: string
  /** Ready-to-render URL. Storage paths are signed before they reach the page. */
  url: string
  primary: boolean
  sortOrder: number
  /** Empty when the photo is shown for every color. */
  color: string
}

export interface ProductVariant {
  id: string
  color: string
  size: string
  sku: string | null
  price: number | null
  stock: number
  active: boolean
}

export interface Product {
  id: string
  name: LocalizedText
  slug: string
  description: LocalizedText
  /** Lowest active variant price, or the product price when no variant overrides it. */
  price: number
  basePrice: number
  oldPrice?: number
  categoryId: string
  image: string
  images: string[]
  gallery: ProductImage[]
  discount?: number
  featured: boolean
  isVisible: boolean
  isNew: boolean
  isBestSeller: boolean
  /** Units available across active variants. */
  stock: number
  rating?: number
  reviewsCount?: number
  colors: string[]
  sizes: string[]
  specifications?: ProductSpec[]
  variants: ProductVariant[]
  createdAt: string
}

export type ProductSortOption =
  'newest' | 'price-asc' | 'price-desc' | 'featured' | 'bestsellers'

export interface ProductFilters {
  material?: string
  search?: string
  categorySlug?: string
  minPrice?: number
  maxPrice?: number
  sort?: ProductSortOption
}
