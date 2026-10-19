import { Link } from 'react-router-dom'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import type { Category } from '../../types/category'
import DirectionalArrow from '../common/DirectionalArrow'

export default function CategoryCard({ category }: { category: Category }) {
  const { locale } = useLocale()
  const name = localized(category.name, locale)

  return (
    <Link to={`/products?category=${category.slug}`} className="category-tile">
      <img src={category.image} alt="" />
      <span className="category-tile-label">
        <span>{name}</span>
        <DirectionalArrow size={18} />
      </span>
    </Link>
  )
}
