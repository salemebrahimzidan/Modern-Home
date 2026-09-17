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

const sortOptions: Array<{ value: ProductSortOption; label: string }> = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price-asc', label: 'السعر: من الأقل للأعلى' },
  { value: 'price-desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'bestsellers', label: 'الأكثر مبيعاً' },
  { value: 'featured', label: 'المميزة' },
]

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
  return (
    <aside className="space-y-5 rounded-2xl border border-mist/70 bg-surface p-4 shadow-card lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">تصفية</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-accent hover:underline"
        >
          إعادة تعيين
        </button>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">القسم</legend>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={!categorySlug}
            label="الكل"
            onClick={() => onCategoryChange('')}
          />
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              active={categorySlug === category.slug}
              label={category.name}
              onClick={() => onCategoryChange(category.slug)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">نطاق السعر</legend>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            placeholder="من"
            aria-label="أقل سعر"
            className="rounded-xl border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="إلى"
            aria-label="أعلى سعر"
            className="rounded-xl border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </fieldset>

      <label className="block text-sm font-medium">
        الترتيب
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
