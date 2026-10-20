import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import type { Category } from '../../types/category'
import { FALLBACK_IMAGE } from '../../utils/images'
import DirectionalArrow from '../common/DirectionalArrow'

export default function CategoryCard({ category }: { category: Category }) {
  const { locale } = useLocale()
  const { products } = useCatalog()
  const name = localized(category.name, locale)
  const cover =
    products.find(
      (product) =>
        product.categoryId === category.id &&
        product.isVisible &&
        product.image &&
        product.image !== FALLBACK_IMAGE,
    )?.image ?? category.image

  return (
    <Link to={`/products?category=${category.slug}`} className="category-tile">
      <img src={cover} alt="" />
      <span className="category-tile-label">
        <span>{name}</span>
        <DirectionalArrow size={18} />
      </span>
    </Link>
  )
}
