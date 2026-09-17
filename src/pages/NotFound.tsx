import EmptyState from '../components/common/EmptyState'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'

export default function NotFound() {
  const { t } = useLocale()
  usePageSeo(t('notFound.seoTitle'))

  return (
    <EmptyState
      title={t('notFound.title')}
      description={t('notFound.description')}
      actionLabel={t('notFound.home')}
      actionTo="/"
    />
  )
}
