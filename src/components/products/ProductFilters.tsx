import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react'
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

  const hasActiveFilters = Boolean(categorySlug || minPrice || maxPrice || sort !== 'newest')

  return (
    <aside className="overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card md:sticky md:top-24">
      <div className="flex items-center justify-between gap-3 border-b border-mist/70 bg-accent-soft/60 px-4 py-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2.5 text-start md:pointer-events-none"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="product-filters-panel"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <SlidersHorizontal size={16} />
          </span>
          <span className="min-w-0">
            <h2 className="font-display text-base font-semibold leading-none">{t('common.filter')}</h2>
            <p className="mt-1 truncate text-[11px] text-muted md:hidden">
              {open ? t('common.close') : t('common.category')}
            </p>
          </span>
          <ChevronDown
            size={18}
            className={['ms-auto shrink-0 text-muted transition md:hidden', open ? 'rotate-180' : ''].join(
              ' ',
            )}
          />
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-accent shadow-sm hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-accent"
        >
          <RotateCcw size={12} />
          {t('common.reset')}
        </button>
      </div>

      <div
        id="product-filters-panel"
        className={['space-y-5 px-4 py-4', open ? 'block' : 'hidden md:block'].join(' ')}
      >
        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide text-muted">
            {t('common.category')}
          </legend>
          <div className="flex flex-wrap gap-1.5">
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
          <legend className="mb-2 text-xs font-semibold tracking-wide text-muted">
            {t('common.priceRange')}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              placeholder={t('common.from')}
              aria-label={t('common.minPrice')}
              className="min-w-0 rounded-xl border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              placeholder={t('common.to')}
              aria-label={t('common.maxPrice')}
              className="min-w-0 rounded-xl border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </fieldset>

        <label className="block text-xs font-semibold tracking-wide text-muted">
          {t('common.sort')}
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
            className="mt-2 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
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
        'rounded-full px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'bg-accent text-white shadow-sm'
          : 'bg-paper text-ink ring-1 ring-mist hover:ring-accent/40',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
