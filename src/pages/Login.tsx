import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'

export default function Login() {
  const { t } = useLocale()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/account'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const message = await signIn(email.trim(), password)
    setBusy(false)
    if (message) {
      setError(message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl text-ink">{t('auth.login')}</h1>
      <form className="mt-6 space-y-3" onSubmit={(event) => void onSubmit(event)}>
        <label className="block text-sm">
          {t('auth.email')}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm">
          {t('auth.password')}
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" fullWidth disabled={busy}>
          {t('auth.login')}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        {t('auth.needAccount')}{' '}
        <Link to="/register" className="text-accent">
          {t('auth.register')}
        </Link>
      </p>
    </section>
  )
}
