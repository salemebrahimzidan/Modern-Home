import { Link } from 'react-router-dom'
import CategoryCard from '../categories/CategoryCard'
import { useCatalog } from '../../context/CatalogContext'
import { useLocale } from '../../hooks/useLocale'

export default function CategoriesSection() {
  const { locale, t } = useLocale()
  const { categories } = useCatalog()
  const featured = categories.slice(0, 4)

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
