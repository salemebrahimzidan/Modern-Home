import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import CategoryCard from '../categories/CategoryCard'
import { categories } from '../../data/categories'
import { useLocale } from '../../hooks/useLocale'

export default function CategoriesSection() {
  const { t } = useLocale()

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <LayoutGrid size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              {t('home.categoriesEyebrow')}
            </p>
            <h2 className="mt-0.5 font-display text-2xl font-bold sm:text-3xl">
              {t('home.categoriesTitle')}
            </h2>
          </div>
        </div>
        <Link to="/categories" className="shrink-0 self-start text-sm text-muted hover:text-accent sm:self-auto">
          {t('common.viewAll')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}
