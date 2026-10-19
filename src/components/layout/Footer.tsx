import { Link } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { useLocale } from '../../hooks/useLocale'
export default function Footer() {
  const { locale, t } = useLocale()
  const ar = locale === 'ar'
  return (
    <footer className="store-footer">
      <div className="footer-content">
        <div>
          <div className="store-wordmark">
            {storeConfig.name}
            <small>KITCHEN &amp; LIVING</small>
          </div>
          <p>
            {ar
              ? 'كل احتياجات مطبخك في مكان واحد. أدوات عملية، تفاصيل أنيقة، ولحظات أجمل.'
              : 'Thoughtful kitchen essentials, everyday details, and moments worth sharing.'}
          </p>
        </div>
        <div>
          <h3>{ar ? 'اكتشف مودرن هوم' : 'Explore Modern Home'}</h3>
          <Link to="/products">{t('nav.products')}</Link>
          <Link to="/categories">{t('nav.categories')}</Link>
          <Link to="/offers">{t('nav.offers')}</Link>
          <Link to="/about">{t('nav.about')}</Link>
        </div>
        <div>
          <h3>{t('nav.contact')}</h3>
          <a href={'tel:' + storeConfig.whatsapp} dir="ltr">
            {storeConfig.phone}
          </a>
          <a
            href={'https://wa.me/' + storeConfig.whatsapp.replace(/\D/g, '')}
            target="_blank"
            rel="noopener"
          >
            {t('common.whatsapp')} ↗
          </a>
          <a href={storeConfig.instagram} target="_blank" rel="noopener">
            {t('common.instagram')} ↗
          </a>
          <Link to="/#shopping-help">
            {ar ? 'التوصيل والاستبدال' : 'Delivery & returns'}
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {storeConfig.name}. {t('footer.rights')}
        </span>
        <span>
          {ar
            ? 'صور توضيحية. تُؤكد المواصفات والتوفر قبل الشراء.'
            : 'Illustrative photos. Confirm specifications and availability before purchase.'}
        </span>
      </div>
    </footer>
  )
}
