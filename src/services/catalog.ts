import { categories } from '../data/categories'
import { products } from '../data/products'
import type { Category } from '../types/category'
import type { Product, ProductFilters, ProductSortOption } from '../types/product'

/**
 * Data access layer — swap implementations later for API / Supabase / Firebase.
 */
export async function fetchCategories(): Promise<Category[]> {
  return categories
}

export async function fetchProducts(): Promise<Product[]> {
  return products
}

export async function fetchProductById(id: number): Promise<Product | undefined> {
  return products.find((product) => product.id === id)
}

export async function fetchProductBySlug(slug: string): Promise<Product | undefined> {
  const bySlug = products.find((product) => product.slug === slug)
  if (bySlug) return bySlug

  const numericId = Number(slug)
  if (!Number.isNaN(numericId)) {
    return products.find((product) => product.id === numericId)
  }

  return undefined
}

export function getCategoryById(id: number): Category | undefined {
  return categories.find((category) => category.id === id)
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug)
}

export function getCategoryName(categoryId: number): string {
  return getCategoryById(categoryId)?.name ?? 'قسم غير معروف'
}

export function getCategoryProductCount(categoryId: number): number {
  return products.filter((product) => product.categoryId === categoryId).length
}

export function filterAndSortProducts(
  allProducts: Product[],
  filters: ProductFilters,
): Product[] {
  let result = [...allProducts]

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    result = result.filter((product) => {
      const categoryName = getCategoryName(product.categoryId).toLowerCase()
      return (
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        categoryName.includes(q)
      )
    })
  }

  if (filters.categorySlug) {
    const category = getCategoryBySlug(filters.categorySlug)
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
      result.sort((a, b) => Number(b.featured) - Number(a.featured) || b.id - a.id)
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
      result.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.id - a.id)
      break
  }

  return result
}

export function getFeaturedProducts(limit = 8): Product[] {
  return products.filter((product) => product.featured).slice(0, limit)
}

export function getNewProducts(limit = 8): Product[] {
  return products.filter((product) => product.isNew).slice(0, limit)
}

export function getBestSellerProducts(limit = 8): Product[] {
  return products.filter((product) => product.isBestSeller).slice(0, limit)
}

export function getOfferProducts(limit?: number): Product[] {
  const offers = products.filter(
    (product) => product.oldPrice && product.oldPrice > product.price,
  )
  return typeof limit === 'number' ? offers.slice(0, limit) : offers
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
    .slice(0, limit)
}

export function getPriceBounds(allProducts: Product[] = products): {
  min: number
  max: number
} {
  if (allProducts.length === 0) return { min: 0, max: 0 }
  const prices = allProducts.map((product) => product.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}
