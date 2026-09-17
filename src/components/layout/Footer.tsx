import { Link } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { useLocale } from '../../context/LocaleContext'
import { categories } from '../../data/categories'
import { localized } from '../../i18n/types'
import { openWhatsAppChat } from '../../utils/whatsapp'
import WhatsAppIcon from '../common/WhatsAppIcon'

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.09 15.83 2 14.61 2 11.89 2 10 3.66 10 6.7V9.5H7v4h3V22h4z" />
    </svg>
  )
}

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export default function Footer() {
  const { locale, t } = useLocale()

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#17110e] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-bold text-[#efd3be]">{storeConfig.name}</p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            {localized(storeConfig.description, locale)}
          </p>
        </div>

        <div>
          <p className="mb-4 font-semibold">{t('footer.quickLinks')}</p>
          <div className="flex flex-col gap-2 text-sm text-white/70">
            <Link to="/" className="hover:text-white">
              {t('nav.home')}
            </Link>
            <Link to="/products" className="hover:text-white">
              {t('nav.products')}
            </Link>
            <Link to="/categories" className="hover:text-white">
              {t('nav.categories')}
            </Link>
            <Link to="/offers" className="hover:text-white">
              {t('nav.offers')}
            </Link>
            <Link to="/about" className="hover:text-white">
              {t('nav.about')}
            </Link>
            <Link to="/contact" className="hover:text-white">
              {t('nav.contact')}
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-4 font-semibold">{t('footer.categories')}</p>
          <div className="flex flex-col gap-2 text-sm text-white/70">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="hover:text-white"
              >
                {localized(category.name, locale)}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-4 font-semibold">{t('footer.contact')}</p>
          <div className="space-y-2 text-sm text-white/70">
            <p>{localized(storeConfig.address, locale)}</p>
            <p>{storeConfig.phone}</p>
            <p>{localized(storeConfig.openingHours, locale)}</p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => openWhatsAppChat()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white hover:bg-[#1ebe57]"
                aria-label={t('common.whatsapp')}
              >
                <WhatsAppIcon size={20} />
              </button>
              <a
                href={storeConfig.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                aria-label={t('common.facebook')}
              >
                <FacebookIcon size={20} />
              </a>
              <a
                href={storeConfig.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                aria-label={t('common.instagram')}
              >
                <InstagramIcon size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {storeConfig.name}. {t('footer.rights')}
      </div>
    </footer>
  )
}
