import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import DirectionalArrow from '../common/DirectionalArrow'
import { useCatalog } from '../../context/CatalogContext'
import { useCart } from '../../hooks/useCart'
import { useLocale } from '../../hooks/useLocale'
import { getCategoryName } from '../../services/catalog'
import type { Product } from '../../types/product'
import { localized } from '../../i18n/types'
import { FALLBACK_IMAGE } from '../../utils/images'
import { formatCurrency } from '../../utils/currency'
import { getProductDiscount, getProductPath } from '../../utils/product'
export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const { categories } = useCatalog()
  const { locale, t } = useLocale()
  const name = localized(product.name, locale)
  const path = getProductPath(product)
  const discount = getProductDiscount(product)
  return (
    <article className="refined-product">
      <Link to={path} className="refined-product-image">
        <img
          src={product.image}
          alt={name}
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK_IMAGE)
              e.currentTarget.src = FALLBACK_IMAGE
          }}
        />
        {discount ? (
          <span className="product-badge">
            {t('common.discount', { percent: discount })}
          </span>
        ) : product.isNew ? (
          <span className="product-badge">{t('common.new')}</span>
        ) : null}
      </Link>
      <div className="refined-product-copy">
        <p className="product-category">{getCategoryName(categories, product.categoryId, locale)}</p>
        <Link to={path}>
          <h3>{name}</h3>
        </Link>
        <div className="product-spec-chips">
          {product.specifications?.slice(0, 2).map((s, i) => (
            <span key={i}>{localized(s.value, locale)}</span>
          ))}
        </div>
        <div className="product-prices">
          <strong>{formatCurrency(product.price, locale)}</strong>
          {product.oldPrice && product.oldPrice > product.price ? (
            <del>{formatCurrency(product.oldPrice, locale)}</del>
          ) : null}
        </div>
        <div className="product-card-actions">
          <Link to={path}>
            {t('common.details')}
            <DirectionalArrow size={13} />
          </Link>
          <button
            disabled={product.stock <= 0}
            onClick={() => addToCart(product)}
            aria-label={
              product.stock <= 0
                ? t('product.outOfStock')
                : t('product.addAria', { name })
            }
          >
            {product.stock <= 0
              ? locale === 'ar'
                ? 'غير متوفر'
                : 'Unavailable'
              : t('common.addToCart')}
            {product.stock > 0 ? <Plus size={15} /> : null}
          </button>
        </div>
      </div>
    </article>
  )
}
