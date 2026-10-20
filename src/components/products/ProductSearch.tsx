import { Search, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useLocale } from '../../hooks/useLocale'

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
}

export default function ProductSearch({ value, onChange, onSubmit }: ProductSearchProps) {
  const { t } = useLocale()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <form onSubmit={handleSubmit} className="catalog-search-form" role="search">
      <Search size={18} className="catalog-search-icon" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('common.searchCatalogPlaceholder')}
        aria-label={t('common.searchProducts')}
        className="catalog-search"
      />
      {value ? (
        <button
          type="button"
          className="catalog-search-clear"
          aria-label={t('common.clearSearch')}
          onClick={() => onChange('')}
        >
          <X size={16} />
        </button>
      ) : null}
    </form>
  )
}
