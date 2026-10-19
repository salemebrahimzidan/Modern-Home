import { Link } from 'react-router-dom'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'

export default function Account() {
  const { t } = useLocale()
  const { profile, user, signOut } = useAuth()

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl text-ink">{t('account.title')}</h1>
      <p className="mt-2 text-muted">{profile?.fullName || user?.email}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/account/orders">
          <Button>{t('account.orders')}</Button>
        </Link>
        <Button variant="ghost" onClick={() => void signOut()}>
          {t('auth.logout')}
        </Button>
      </div>
    </section>
  )
}
