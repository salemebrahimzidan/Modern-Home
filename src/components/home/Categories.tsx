import { Link } from 'react-router-dom'
import CategoryCard from '../categories/CategoryCard'
import { categories } from '../../data/categories'
import { useLocale } from '../../hooks/useLocale'

const featuredSlugs = ['cookware', 'kitchen-tools', 'kitchen-storage', 'serving']

export default function CategoriesSection() {
  const { locale, t } = useLocale()
  const featured = featuredSlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category) => category !== undefined)

  return (
    <section className="collection-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{locale === 'ar' ? 'الأقسام' : 'The collection'}</p>
          <h2>{t('home.categoriesTitle')}</h2>
        </div>
        <Link to="/categories" className="editorial-text-link">
          {t('common.viewAll')}
        </Link>
      </div>
      <div className="category-grid">
        {featured.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}
