import { BadgeCheck, Eye, Headset, Layers3 } from 'lucide-react'
import { storeConfig } from '../config/store'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { localized, type Locale, type LocalizedText } from '../i18n/types'

export default function About() {
  const { locale, t } = useLocale()
  usePageSeo(t('about.seoTitle'), localized(storeConfig.description, locale))

  const cards = [
    { icon: Eye, title: t('about.vision'), body: storeConfig.about.vision },
    { icon: BadgeCheck, title: t('about.quality'), body: storeConfig.about.quality },
    { icon: Layers3, title: t('about.variety'), body: storeConfig.about.variety },
    { icon: Headset, title: t('about.service'), body: storeConfig.about.service },
  ]

  return (
    <section className="flex h-full min-h-0 flex-col justify-center px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-sm font-medium text-accent">{t('about.eyebrow')}</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">{t('about.title')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          {localized(storeConfig.description, locale)}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <AboutCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              body={card.body}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function AboutCard({
  icon: Icon,
  title,
  body,
  locale,
}: {
  icon: typeof Eye
  title: string
  body: LocalizedText
  locale: Locale
}) {
  return (
    <article className="flex items-start gap-3 rounded-xl border border-mist/70 bg-surface p-3 shadow-card">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <h2 className="font-display text-sm font-semibold">{title}</h2>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{localized(body, locale)}</p>
      </div>
    </article>
  )
}
