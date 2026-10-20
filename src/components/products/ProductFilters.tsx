import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import type { Category } from '../../types/category'
import type { ProductSortOption } from '../../types/product'

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const menuId = useId()
  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const selectedOption = menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')
    selectedOption?.focus()

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function moveFocus(direction: 1 | -1) {
    const buttons = [...(menuRef.current?.querySelectorAll('button') ?? [])]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next = buttons[index + direction] ?? buttons[direction === 1 ? 0 : buttons.length - 1]
    next?.focus()
  }

  return (
    <div ref={rootRef} className="catalog-select">
      <span>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        className="catalog-select-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={16} className={open ? 'is-open' : undefined} />
      </button>
      {open ? (
        <ul
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-label={label}
          className="catalog-select-menu"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              moveFocus(1)
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              moveFocus(-1)
            }
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value || 'all'} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={isSelected ? 'is-selected' : undefined}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                    triggerRef.current?.focus()
                  }}
                >
                  <span>{option.label}</span>
                  {isSelected ? <Check size={14} /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

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
      { value: 'featured', label: t('sort.featured') },
      { value: 'bestsellers', label: t('sort.bestsellers') },
    ],
    [t],
  )

  const hasActiveFilters = Boolean(
    categorySlug || minPrice || maxPrice || (sort !== 'newest' && sort !== 'featured'),
  )

  const panel = (
    <div id="product-filters-panel" className="catalog-filter-panel">
      <div className="catalog-filter-grid">
        <FilterSelect
          label={t('common.category')}
          value={categorySlug}
          onChange={onCategoryChange}
          options={[
            { value: '', label: locale === 'ar' ? 'كل الأقسام' : 'All categories' },
            ...categories.map((category) => ({
              value: category.slug,
              label: localized(category.name, locale),
            })),
          ]}
        />
        <label>
          {t('common.minPrice')}
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            placeholder={t('common.from')}
          />
        </label>
        <label>
          {t('common.maxPrice')}
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder={t('common.to')}
          />
        </label>
        <FilterSelect
          label={t('common.sort')}
          value={sort}
          onChange={(value) => onSortChange(value as ProductSortOption)}
          options={sortOptions}
        />
      </div>
    </div>
  )

  return (
    <div className="catalog-filters">
      <div className="catalog-filters-toolbar">
        <button
          type="button"
          className="catalog-filter-toggle md:hidden"
          aria-expanded={open}
          aria-controls="product-filters-panel"
          onClick={() => setOpen((value) => !value)}
        >
          {t('common.filter')}
          <ChevronDown size={16} className={open ? 'rotate-180' : undefined} />
        </button>
        <button type="button" onClick={onReset} disabled={!hasActiveFilters} className="catalog-reset">
          <RotateCcw size={13} />
          {t('common.reset')}
        </button>
      </div>
      <div className={open ? 'block' : 'hidden md:block'}>{panel}</div>
    </div>
  )
}
