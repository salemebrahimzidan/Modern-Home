import { NavLink } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { useLocale } from '../../hooks/useLocale'

export default function Footer() {
  const { t } = useLocale()

  const pageLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/products', label: t('nav.products') },
    { to: '/categories', label: t('nav.categories') },
    { to: '/offers', label: t('nav.offers') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ]

  return (
    <footer className="mt-auto border-t border-mist bg-paper px-4 py-3 text-center text-xs text-muted">
      <nav className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {pageLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              isActive ? 'font-semibold text-accent' : 'text-muted hover:text-ink'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <p className="text-muted/80">
        © {new Date().getFullYear()} {storeConfig.name}. {t('footer.rights')}
      </p>
    </footer>
  )
}
