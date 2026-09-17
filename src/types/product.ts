export interface Product {
  id: number
  name: string
  slug: string
  description: string
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
  specifications?: Record<string, string>
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
