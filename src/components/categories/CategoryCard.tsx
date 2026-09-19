import { Link } from 'react-router-dom'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import type { Category } from '../../types/category'
import { getCategoryProductCount } from '../../services/catalog'

interface CategoryCardProps {
  category: Category
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { locale, t } = useLocale()
  const name = localized(category.name, locale)
  const description = category.description ? localized(category.description, locale) : null
  const count = getCategoryProductCount(category.id)

  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="group relative min-w-0 overflow-hidden rounded-2xl border border-mist/70 shadow-card"
    >
      <img
        src={category.image}
        alt={name}
        loading="lazy"
        className="aspect-[5/4] w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <h3 className="font-display text-base font-semibold text-white sm:text-lg">{name}</h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/80 sm:text-xs">{description}</p>
        ) : null}
        <p className="mt-2 inline-flex rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white sm:mt-3">
          {t('common.productCount', { count })}
        </p>
      </div>
    </Link>
  )
}
