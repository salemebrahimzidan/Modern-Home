import { ChevronDown, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import type { LocalizedText } from '../../i18n/types'
import type { Category } from '../../types/category'
import type { ProductSortOption } from '../../types/product'

interface ProductFiltersProps {
  materials: LocalizedText[]
  material: string
  onMaterialChange: (value: string) => void
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
  materials,
  material,
  onMaterialChange,
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
    material || categorySlug || minPrice || maxPrice || (sort !== 'newest' && sort !== 'featured'),
  )

  const panel = (
    <div id="product-filters-panel" className="catalog-filter-panel">
      <div className="catalog-categories" role="group" aria-label={t('common.category')}>
        <button
          type="button"
          className={!categorySlug ? 'is-active' : undefined}
          onClick={() => onCategoryChange('')}
        >
          {t('common.all')}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={categorySlug === category.slug ? 'is-active' : undefined}
            onClick={() => onCategoryChange(category.slug)}
          >
            {localized(category.name, locale)}
          </button>
        ))}
      </div>

      <div className="catalog-filter-grid">
        <label>
          {locale === 'ar' ? 'الخامة' : 'Material'}
          <select value={material} onChange={(event) => onMaterialChange(event.target.value)}>
            <option value="">{locale === 'ar' ? 'كل الخامات' : 'All materials'}</option>
            {materials.map((item) => (
              <option key={item.en} value={item.en}>
                {localized(item, locale)}
              </option>
            ))}
          </select>
        </label>
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
        <label>
          {t('common.sort')}
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as ProductSortOption)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
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
