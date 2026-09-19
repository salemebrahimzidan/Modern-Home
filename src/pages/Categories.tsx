import { LayoutGrid } from 'lucide-react'
import CategoryCard from '../components/categories/CategoryCard'
import { categories } from '../data/categories'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'

export default function CategoriesPage() {
  const { t } = useLocale()
  usePageSeo(t('categoriesPage.seoTitle'), t('categoriesPage.seoDescription'))

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-start gap-3 sm:mb-8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent sm:h-11 sm:w-11">
          <LayoutGrid size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            {t('categoriesPage.eyebrow')}
          </p>
          <h1 className="mt-0.5 font-display text-2xl font-bold sm:text-3xl">
            {t('categoriesPage.title')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            {t('categoriesPage.description')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}
