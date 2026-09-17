import { storeConfig } from '../config/store'

import { useLocale } from '../hooks/useLocale'

import { usePageSeo } from '../hooks/usePageSeo'

import { localized, type Locale, type LocalizedText } from '../i18n/types'



export default function About() {

  const { locale, t } = useLocale()

  usePageSeo(t('about.seoTitle'), localized(storeConfig.description, locale))



  return (

    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">

      <p className="text-sm font-medium text-accent">{t('about.eyebrow')}</p>

      <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t('about.title')}</h1>

      <p className="mt-5 leading-8 text-muted">{localized(storeConfig.description, locale)}</p>



      <div className="mt-10 grid gap-4 sm:grid-cols-2">

        <AboutCard title={t('about.vision')} body={storeConfig.about.vision} locale={locale} />

        <AboutCard title={t('about.quality')} body={storeConfig.about.quality} locale={locale} />

        <AboutCard title={t('about.variety')} body={storeConfig.about.variety} locale={locale} />

        <AboutCard title={t('about.service')} body={storeConfig.about.service} locale={locale} />

      </div>

    </section>

  )

}



function AboutCard({

  title,

  body,

  locale,

}: {

  title: string

  body: LocalizedText

  locale: Locale

}) {

  return (

    <article className="rounded-2xl border border-mist/70 bg-surface p-6 shadow-card">

      <h2 className="font-display text-xl font-semibold">{title}</h2>

      <p className="mt-3 text-sm leading-7 text-muted">{localized(body, locale)}</p>

    </article>

  )

}

