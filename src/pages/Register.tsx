import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../hooks/useLocale'
import { isValidEgyptianPhone } from '../utils/validation'

export default function Register() {
  const { t } = useLocale()
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValidEgyptianPhone(phone)) {
      setError(t('validation.phoneInvalid'))
      return
    }
    setBusy(true)
    setError('')
    const message = await signUp({ email: email.trim(), password, fullName: fullName.trim(), phone })
    setBusy(false)
    if (message === 'CONFIRM_EMAIL') {
      setNotice(t('auth.confirmEmail'))
      return
    }
    if (message) {
      setError(message)
      return
    }
    navigate('/account', { replace: true })
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl text-ink">{t('auth.register')}</h1>
      <form className="mt-6 space-y-3" onSubmit={(event) => void onSubmit(event)}>
        <label className="block text-sm">
          {t('auth.fullName')}
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm">
          {t('auth.phone')}
          <input
            required
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
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
        {notice ? <p className="text-sm text-success">{notice}</p> : null}
        <Button type="submit" fullWidth disabled={busy}>
          {t('auth.register')}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-accent">
          {t('auth.login')}
        </Link>
      </p>
    </section>
  )
}
