import { ArrowLeft, Percent } from 'lucide-react'
import { Link } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import Button from '../common/Button'
import { unsplashPhoto } from '../../utils/images'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        <img
          src={unsplashPhoto('photo-1556912173-46c336c7fd55', { width: 1800, height: 1000 })}
          alt="معرض أدوات ومستلزمات المطبخ"
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-ink/92 via-[#3d2618]/78 to-accent/25" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <p className="animate-fade-up text-xs font-medium tracking-[0.28em] text-[#efd3be]">
            {storeConfig.nameEn}
          </p>
          <h1 className="animate-fade-up-delay mt-4 font-display text-4xl font-bold leading-[1.25] sm:text-5xl">
            كل احتياجات مطبخك في مكان واحد
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-md text-base leading-8 text-white/80">
            أدوات ومستلزمات مطبخ عملية وأنيقة بجودة وأسعار مناسبة
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products">
              <Button size="lg" className="bg-accent hover:bg-accent-dark">
                تصفح المنتجات
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <Link to="/offers">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Percent size={18} />
                شوف العروض
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
