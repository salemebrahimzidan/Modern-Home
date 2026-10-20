import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../hooks/useLocale'
import { useCart } from '../../hooks/useCart'
import { openWhatsAppChat } from '../../utils/whatsapp'
import LanguageToggle from '../common/LanguageToggle'
import WhatsAppIcon from '../common/WhatsAppIcon'
import AccountDrawer from './AccountDrawer'
import MobileMenu from './MobileMenu'

export default function Navbar() {
  const { getCartItemsCount } = useCart()
  const { session } = useAuth()
  const { t } = useLocale()
  const count = getCartItemsCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = useMemo(
    () => [
      { to: '/', label: t('nav.home') },
      { to: '/products', label: t('nav.products') },
      { to: '/account/orders', label: t('account.orders') },
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
    setAccountOpen(false)
  }, [location.pathname, location.search])

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
    setSearchOpen(false)
  }

  return (
    <header className="border-b border-mist bg-paper">
      <div className="mx-auto flex max-w-[1232px] min-w-0 items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="header-icon inline-flex xl:hidden"
            aria-label={menuOpen ? t('common.closeMenu') : t('common.openMenu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="min-w-0">
            <span className="store-wordmark">
              {storeConfig.name}
              <small>KITCHEN &amp; LIVING</small>
            </span>
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
              end={link.to === '/' || link.to === '/account/orders'}
              className={({ isActive }) =>
                isActive ? 'font-semibold text-accent' : 'text-muted hover:text-ink'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <LanguageToggle />
          <button
            type="button"
            className="header-icon inline-flex"
            aria-label={t('common.searchAria')}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            className="header-icon hidden text-[#128C7E] sm:inline-flex"
            aria-label={t('common.whatsapp')}
            onClick={() => openWhatsAppChat()}
          >
            <WhatsAppIcon size={18} />
          </button>
          {session ? (
            <button
              type="button"
              className="header-icon inline-flex"
              aria-label={t('nav.accountAria')}
              aria-expanded={accountOpen}
              onClick={() => {
                setMenuOpen(false)
                setSearchOpen(false)
                setAccountOpen((open) => !open)
              }}
            >
              <UserRound size={20} />
            </button>
          ) : (
            <Link to="/login" className="header-icon inline-flex" aria-label={t('nav.accountAria')}>
              <UserRound size={20} />
            </Link>
          )}
          <Link
            to="/cart"
            className="header-icon relative inline-flex"
            aria-label={count > 0 ? t('nav.cartAriaCount', { count }) : t('nav.cartAria')}
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
      <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} />
    </header>
  )
}
