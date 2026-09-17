import CategoriesSection from '../components/home/Categories'
import FeaturedProducts from '../components/home/FeaturedProducts'
import Hero from '../components/home/Hero'
import LatestProducts from '../components/home/LatestProducts'
import BestSellers from '../components/home/BestSellers'
import OffersSection from '../components/home/OffersSection'
import WhatsAppCta from '../components/home/WhatsAppCta'
import WhyUs from '../components/home/WhyUs'
import { storeConfig } from '../config/store'
import { usePageSeo } from '../hooks/usePageSeo'

export default function Home() {
  usePageSeo('الرئيسية', storeConfig.description)

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
