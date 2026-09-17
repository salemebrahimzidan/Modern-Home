import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import type { Category } from '../../types/category'
import type { ProductSortOption } from '../../types/product'

interface ProductFiltersProps {
  categories: Category[]
  categorySlug: string
  sort: ProductSortOption
  minPrice: string
  maxPrice: string
  onCategoryChange: (slug: string) => void
  onSortChange: (sort: ProductSortOption) => void
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  onReset: () => void
}

export default function ProductFilters({
  categories,
  categorySlug,
  sort,
  minPrice,
  maxPrice,
  onCategoryChange,
  onSortChange,
  onMinPriceChange,
  onMaxPriceChange,
  onReset,
}: ProductFiltersProps) {
  const { locale, t } = useLocale()
  const [open, setOpen] = useState(false)

  const sortOptions = useMemo(
    (): Array<{ value: ProductSortOption; label: string }> => [
      { value: 'newest', label: t('sort.newest') },
      { value: 'price-asc', label: t('sort.priceAsc') },
      { value: 'price-desc', label: t('sort.priceDesc') },
      { value: 'bestsellers', label: t('sort.bestsellers') },
      { value: 'featured', label: t('sort.featured') },
    ],
    [t],
  )

  return (
    <aside className="rounded-2xl border border-mist/70 bg-surface shadow-card lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3 p-4">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-start lg:pointer-events-none"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="product-filters-panel"
        >
          <SlidersHorizontal size={18} className="text-accent lg:hidden" />
          <h2 className="font-display text-lg font-semibold">{t('common.filter')}</h2>
          <ChevronDown
            size={18}
            className={[
              'ms-auto text-muted transition lg:hidden',
              open ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 text-sm text-accent hover:underline"
        >
          {t('common.reset')}
        </button>
      </div>

      <div
        id="product-filters-panel"
        className={[
          'space-y-5 overflow-hidden border-t border-mist px-4 pb-4 pt-4',
          open ? 'block' : 'hidden lg:block',
        ].join(' ')}
      >
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t('common.category')}</legend>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={!categorySlug}
              label={t('common.all')}
              onClick={() => onCategoryChange('')}
            />
            {categories.map((category) => (
              <FilterChip
                key={category.id}
                active={categorySlug === category.slug}
                label={localized(category.name, locale)}
                onClick={() => onCategoryChange(category.slug)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t('common.priceRange')}</legend>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              placeholder={t('common.from')}
              aria-label={t('common.minPrice')}
              className="min-w-0 rounded-xl border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              placeholder={t('common.to')}
              aria-label={t('common.maxPrice')}
              className="min-w-0 rounded-xl border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
        </fieldset>

        <label className="block text-sm font-medium">
          {t('common.sort')}
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
            className="mt-2 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  )
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1.5 text-xs transition',
        active ? 'bg-accent text-white' : 'bg-mist text-ink hover:bg-mist/80',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
