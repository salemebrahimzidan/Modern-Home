import { ArrowLeft, Percent } from 'lucide-react'
import { Link } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { useLocale } from '../../hooks/useLocale'
import { localized } from '../../i18n/types'
import Button from '../common/Button'
import { unsplashPhoto } from '../../utils/images'

export default function Hero() {
  const { locale, t } = useLocale()

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        <img
          src={unsplashPhoto('photo-1556912173-46c336c7fd55', { width: 1800, height: 1000 })}
          alt={t('home.heroAlt')}
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-ink/92 via-[#3d2618]/78 to-accent/25" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 md:py-28">
        <div className="max-w-xl">
          <p className="animate-fade-up text-[10px] font-medium tracking-[0.12em] text-[#efd3be] sm:text-xs sm:tracking-[0.28em]">
            {storeConfig.nameEn}
          </p>
          <h1 className="animate-fade-up-delay mt-3 font-display text-[1.75rem] font-bold leading-[1.3] sm:mt-4 sm:text-4xl sm:leading-[1.25] md:text-5xl">
            {localized(storeConfig.tagline, locale)}
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-md text-sm leading-7 text-white/80 sm:mt-5 sm:text-base sm:leading-8">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Link to="/products" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-accent hover:bg-accent-dark sm:w-auto">
                {t('home.browseProducts')}
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <Link to="/offers" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
              >
                <Percent size={18} />
                {t('home.seeOffers')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
