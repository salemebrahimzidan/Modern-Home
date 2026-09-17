import EmptyState from '../components/common/EmptyState'
import { usePageSeo } from '../hooks/usePageSeo'

export default function NotFound() {
  usePageSeo('الصفحة غير موجودة')

  return (
    <EmptyState
      title="الصفحة غير موجودة"
      description="عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها."
      actionLabel="العودة للرئيسية"
      actionTo="/"
    />
  )
}
