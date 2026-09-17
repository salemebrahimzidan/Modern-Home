import { ShoppingBag } from 'lucide-react'
import EmptyState from '../common/EmptyState'

export default function EmptyCart() {
  return (
    <EmptyState
      title="سلتك فارغة"
      description="أضف أدوات المطبخ من المعرض ثم عد لإرسال طلبك عبر واتساب."
      actionLabel="تصفح المنتجات"
      actionTo="/products"
      icon={<ShoppingBag size={40} />}
    />
  )
}
