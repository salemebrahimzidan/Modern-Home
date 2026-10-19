import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchCategories, fetchProducts } from '../services/catalog'
import type { Category } from '../types/category'
import type { Product } from '../types/product'
import { useAuth } from './AuthContext'

interface CatalogContextValue {
  ready: boolean
  error: string
  categories: Category[]
  products: Product[]
  reload: () => Promise<void>
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, session } = useAuth()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const reload = useCallback(async () => {
    setError('')
    try {
      const [nextCategories, nextProducts] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
      ])
      setCategories(nextCategories)
      setProducts(nextProducts)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Catalog request failed')
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (!authReady) return
    void reload()
  }, [authReady, reload, session?.user.id])

  const value = useMemo(
    () => ({ ready, error, categories, products, reload }),
    [ready, error, categories, products, reload],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogContextValue {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('useCatalog must be used within CatalogProvider')
  return value
}
