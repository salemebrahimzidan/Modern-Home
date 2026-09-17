import CategoriesSection from '../components/home/Categories'
import FeaturedProducts from '../components/home/FeaturedProducts'
import Hero from '../components/home/Hero'
import LatestProducts from '../components/home/LatestProducts'
import BestSellers from '../components/home/BestSellers'
import OffersSection from '../components/home/OffersSection'
import WhatsAppCta from '../components/home/WhatsAppCta'
import WhyUs from '../components/home/WhyUs'
import { storeConfig } from '../config/store'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { localized } from '../i18n/types'

export default function Home() {
  const { locale, t } = useLocale()
  usePageSeo(t('home.seoTitle'), localized(storeConfig.description, locale))

  return (
    <>
      <Hero />
      <CategoriesSection />
      <FeaturedProducts />
      <BestSellers />
      <OffersSection />
      <LatestProducts />
      <WhyUs />
      <WhatsAppCta />
    </>
  )
}
