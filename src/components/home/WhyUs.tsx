import { BadgeCheck, Headset, Layers3, Wallet } from 'lucide-react'
import { useLocale } from '../../hooks/useLocale'

export default function WhyUs() {
  const { t } = useLocale()

  const features = [
    {
      icon: BadgeCheck,
      title: t('home.whyQualityTitle'),
      description: t('home.whyQualityBody'),
    },
    {
      icon: Wallet,
      title: t('home.whyPriceTitle'),
      description: t('home.whyPriceBody'),
    },
    {
      icon: Layers3,
      title: t('home.whyVarietyTitle'),
      description: t('home.whyVarietyBody'),
    },
    {
      icon: Headset,
      title: t('home.whyServiceTitle'),
      description: t('home.whyServiceBody'),
    },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-8 text-center sm:mb-10">
        <p className="text-sm font-medium text-accent">{t('home.whyEyebrow')}</p>
        <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{t('home.whyTitle')}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-mist/70 bg-surface p-5 text-center shadow-card sm:p-6"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <feature.icon size={22} />
            </div>
            <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
