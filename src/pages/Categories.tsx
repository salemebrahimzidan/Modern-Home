import CategoryCard from '../components/categories/CategoryCard'
import { categories } from '../data/categories'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'

export default function CategoriesPage() {
  const { t } = useLocale()
  usePageSeo(t('categoriesPage.seoTitle'), t('categoriesPage.seoDescription'))

  return (
    <section className="catalog-section">
      <header className="catalog-intro">
        <p className="eyebrow">{t('categoriesPage.eyebrow')}</p>
        <h1>{t('categoriesPage.title')}</h1>
        <p>{t('categoriesPage.description')}</p>
      </header>

      <div className="category-grid">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}
