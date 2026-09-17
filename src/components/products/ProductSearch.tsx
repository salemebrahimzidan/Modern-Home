import { Search } from 'lucide-react'
import type { FormEvent } from 'react'

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
}

export default function ProductSearch({ value, onChange, onSubmit }: ProductSearchProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ابحث بالاسم أو القسم أو الوصف..."
        aria-label="بحث المنتجات"
        className="w-full rounded-xl border border-mist bg-surface py-2.5 pe-3 ps-10 text-sm outline-none focus:border-accent"
      />
    </form>
  )
}
