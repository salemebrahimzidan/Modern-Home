import { Clock3, MapPin, Phone } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import Button from '../components/common/Button'
import WhatsAppButton from '../components/common/WhatsAppButton'
import { storeConfig } from '../config/store'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { useToast } from '../context/ToastContext'
import { localized } from '../i18n/types'
import { openWhatsApp } from '../utils/whatsapp'

export default function Contact() {
  const { locale, t } = useLocale()
  usePageSeo(t('contact.seoTitle'), t('contact.seoDescription'))
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !phone.trim() || !message.trim()) {
      showToast(t('contact.fillAll'), 'error')
      return
    }
    openWhatsApp(
      t('contact.whatsappTemplate', {
        name,
        phone,
        message,
      }),
    )
    showToast(t('contact.openingWhatsapp'))
    setName('')
    setPhone('')
    setMessage('')
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-medium text-accent">{t('contact.eyebrow')}</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t('contact.title')}</h1>
        <p className="mt-3 text-muted">{t('contact.description')}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <InfoRow icon={<Phone size={18} />} label={t('contact.phone')} value={storeConfig.phone} />
          <InfoRow
            icon={<MapPin size={18} />}
            label={t('contact.address')}
            value={localized(storeConfig.address, locale)}
          />
          <InfoRow
            icon={<Clock3 size={18} />}
            label={t('contact.hours')}
            value={localized(storeConfig.openingHours, locale)}
          />
          <WhatsAppButton fullWidth size="lg" />
          <div className="flex gap-4 text-sm">
            <a
              href={storeConfig.facebook}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              {t('common.facebook')}
            </a>
            <a
              href={storeConfig.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              {t('common.instagram')}
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl border border-dashed border-mist bg-mist/40">
            {storeConfig.mapEmbedUrl ? (
              <iframe
                title={t('contact.mapTitle')}
                src={storeConfig.mapEmbedUrl}
                className="h-64 w-full border-0"
                loading="lazy"
              />
            ) : (
              <div className="flex h-64 items-center justify-center whitespace-pre-line p-6 text-center text-sm text-muted">
                {t('contact.mapPlaceholder')}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-mist/70 bg-surface p-6 shadow-card"
        >
          <h2 className="font-display text-2xl font-semibold">{t('contact.sendMessage')}</h2>
          <label className="block text-sm">
            {t('contact.name')}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block text-sm">
            {t('contact.phone')}
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block text-sm">
            {t('contact.message')}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 outline-none focus:border-accent"
              required
            />
          </label>
          <Button type="submit" fullWidth size="lg">
            {t('contact.submit')}
          </Button>
        </form>
      </div>
    </section>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-mist/70 bg-surface p-4 shadow-card">
      <div className="rounded-xl bg-accent-soft p-2 text-accent">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 font-medium break-words">{value}</p>
      </div>
    </div>
  )
}
