import { Search } from 'lucide-react'
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
    <form onSubmit={handleSubmit} className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute top-1/2 start-3.5 -translate-y-1/2 text-accent"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('common.searchCatalogPlaceholder')}
        aria-label={t('common.searchProducts')}
        className="w-full rounded-2xl border border-mist bg-surface py-3 pe-4 ps-11 text-sm shadow-card outline-none placeholder:text-muted/80 focus:border-accent focus:ring-2 focus:ring-accent/15"
      />
    </form>
  )
}
