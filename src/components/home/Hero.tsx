import { Link } from 'react-router-dom'
import DirectionalArrow from '../common/DirectionalArrow'
import { useLocale } from '../../hooks/useLocale'
import { unsplashPhoto } from '../../utils/images'
export default function Hero() {
  const { locale, t } = useLocale()
  const ar = locale === 'ar'
  return (
    <>
      <section className="editorial-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            {ar ? 'للطبخ بشغف. وللبيت بحب.' : 'Made for cooking. Chosen for living.'}
          </p>
          <h1>
            {ar ? (
              <>
                تفاصيل صغيرة،
                <br />
                تخلّي مطبخك
                <br />
                <em>حكاية أجمل.</em>
              </>
            ) : (
              <>
                Everyday details.
                <br />A kitchen
                <br />
                <em>you love.</em>
              </>
            )}
          </h1>
          <p className="hero-description">
            {ar
              ? 'من أواني الطهي لأناقة التقديم، اكتشف أدوات تضيف لمسة لمطبخك ومتعة لكل يوم.'
              : 'From everyday cookware to thoughtful tableware, discover the details that make your kitchen feel like home.'}
          </p>
          <Link to="/#catalog" className="editorial-button">
            {ar ? 'اكتشف التشكيلة' : 'Discover the collection'}
            <DirectionalArrow size={18} />
          </Link>
          <div className="hero-notes">
            <Link to="/products?category=cookware">{ar ? 'أواني طهي' : 'Cookware'}</Link>
            <Link to="/products?category=serving">{ar ? 'أدوات تقديم' : 'Serving'}</Link>
            <Link to="/products?category=kitchen-storage">{ar ? 'تخزين وتنظيم' : 'Storage'}</Link>
          </div>
        </div>
        <div className="hero-photograph">
          <img
            src={unsplashPhoto('photo-1556912173-46c336c7fd55', { width: 1600 })}
            alt={t('home.heroAlt')}
            fetchPriority="high"
          />
          <Link className="hero-caption" to="/categories">
            <span>
              <small>THE EVERYDAY COLLECTION</small>
              {ar ? 'لأجمل لحظات البيت' : 'For the moments that matter'}
            </span>
            <DirectionalArrow size={22} />
          </Link>
        </div>
      </section>
      <div className="shopping-benefits">
        <span>{ar ? 'تشكيلة لكل ركن في المطبخ' : 'A collection for every kitchen'}</span>
        <span>{ar ? 'أسعار واضحة قبل الطلب' : 'Clear product prices'}</span>
        <span>{ar ? 'اطلب بسهولة عبر واتساب' : 'Order easily on WhatsApp'}</span>
      </div>
    </>
  )
}
