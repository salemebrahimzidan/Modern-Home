import { ShoppingBag } from 'lucide-react'
import { useLocale } from '../../hooks/useLocale'
import EmptyState from '../common/EmptyState'

export default function EmptyCart() {
  const { t } = useLocale()

  return (
    <EmptyState
      title={t('cart.emptyTitle')}
      description={t('cart.emptyDescription')}
      actionLabel={t('home.browseProducts')}
      actionTo="/products"
      icon={<ShoppingBag size={40} />}
    />
  )
}
