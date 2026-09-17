import type { LocalizedText } from '../i18n/types'

export interface ProductSpec {
  label: LocalizedText
  value: LocalizedText
}

export interface Product {
  id: number
  name: LocalizedText
  slug: string
  description: LocalizedText
  price: number
  oldPrice?: number
  categoryId: number
  image: string
  images: string[]
  discount?: number
  featured: boolean
  isNew: boolean
  isBestSeller: boolean
  stock: number
  rating?: number
  reviewsCount?: number
  colors?: string[]
  sizes?: string[]
  specifications?: ProductSpec[]
}

export type ProductSortOption =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'featured'
  | 'bestsellers'

export interface ProductFilters {
  search?: string
  categorySlug?: string
  minPrice?: number
  maxPrice?: number
  sort?: ProductSortOption
}
