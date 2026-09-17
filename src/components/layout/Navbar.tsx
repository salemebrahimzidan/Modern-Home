import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { useLocale } from '../../hooks/useLocale'
import { useCart } from '../../hooks/useCart'
import { openWhatsAppChat } from '../../utils/whatsapp'
import LanguageToggle from '../common/LanguageToggle'
import WhatsAppIcon from '../common/WhatsAppIcon'
import MobileMenu from './MobileMenu'

export default function Navbar() {
  const { getCartItemsCount } = useCart()
  const { t } = useLocale()
  const count = getCartItemsCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = useMemo(
    () => [
      { to: '/', label: t('nav.home') },
      { to: '/products', label: t('nav.products') },
      { to: '/categories', label: t('nav.categories') },
      { to: '/offers', label: t('nav.offers') },
      { to: '/about', label: t('nav.about') },
      { to: '/contact', label: t('nav.contact') },
    ],
    [t],
  )

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname, location.search])

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-mist/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="shrink-0 rounded-xl p-2 hover:bg-mist xl:hidden"
            aria-label={menuOpen ? t('common.closeMenu') : t('common.openMenu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link
            to="/"
            className="min-w-0 truncate font-display text-lg font-bold tracking-tight text-accent sm:text-xl md:text-2xl"
          >
            {storeConfig.name}
          </Link>
        </div>

        <nav
          className="hidden items-center gap-5 text-sm xl:flex"
          aria-label={t('nav.mainAria')}
        >
          {navLinks.map((link) => (
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

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <LanguageToggle />
          <button
            type="button"
            className="rounded-xl p-2 hover:bg-mist"
            aria-label={t('common.searchAria')}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={20} />
          </button>
          <button
            type="button"
            className="hidden rounded-xl p-2 text-[#128C7E] hover:bg-mist sm:inline-flex"
            aria-label={t('common.whatsapp')}
            onClick={() => openWhatsAppChat()}
          >
            <WhatsAppIcon size={20} />
          </button>
          <Link
            to="/cart"
            className="relative rounded-xl p-2 hover:bg-mist"
            aria-label={
              count > 0 ? t('nav.cartAriaCount', { count }) : t('nav.cartAria')
            }
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-0.5 -start-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <form
          onSubmit={onSearch}
          className="border-t border-mist bg-surface px-3 py-3 sm:px-6"
        >
          <div className="mx-auto flex max-w-7xl gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="min-w-0 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent sm:px-4"
              aria-label={t('common.searchProducts')}
              autoFocus
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-white hover:bg-accent-dark sm:px-4"
            >
              {t('common.search')}
            </button>
          </div>
        </form>
      )}

      <MobileMenu open={menuOpen} links={navLinks} onClose={() => setMenuOpen(false)} />
    </header>
  )
}
