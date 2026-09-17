import { storeConfig } from '../../config/store'
import { useLocale } from '../../hooks/useLocale'
import WhatsAppButton from '../common/WhatsAppButton'

export default function WhatsAppCta() {
  const { t } = useLocale()

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="flex flex-col items-stretch justify-between gap-6 rounded-3xl bg-gradient-to-l from-ink via-ink to-[#3a2418] px-5 py-8 text-white md:flex-row md:items-center md:px-10 md:py-10">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold sm:text-2xl md:text-3xl">{t('home.ctaTitle')}</h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-white/70">
            {t('home.ctaBody', { phone: storeConfig.whatsapp })}
          </p>
        </div>
        <WhatsAppButton
          label={t('home.ctaButton')}
          className="w-full shrink-0 bg-[#25D366] hover:bg-[#1ebe57] md:w-auto"
          size="lg"
        />
      </div>
    </section>
  )
}
