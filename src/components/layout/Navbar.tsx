import { Menu, MessageCircle, Search, ShoppingBag, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { useCart } from '../../hooks/useCart'
import { openWhatsAppChat } from '../../utils/whatsapp'
import MobileMenu from './MobileMenu'

const navLinks = [
  { to: '/', label: 'الرئيسية' },
  { to: '/products', label: 'المنتجات' },
  { to: '/categories', label: 'الأقسام' },
  { to: '/offers', label: 'العروض' },
  { to: '/about', label: 'من نحن' },
  { to: '/contact', label: 'تواصل معنا' },
]

export default function Navbar() {
  const { getCartItemsCount } = useCart()
  const count = getCartItemsCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-mist/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-xl p-2 hover:bg-mist lg:hidden"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="/" className="font-display text-xl font-bold tracking-tight text-accent sm:text-2xl">
            {storeConfig.name}
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm lg:flex" aria-label="التنقل الرئيسي">
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

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="rounded-xl p-2 hover:bg-mist"
            aria-label="بحث"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={20} />
          </button>
          <button
            type="button"
            className="hidden rounded-xl p-2 text-[#128C7E] hover:bg-mist sm:inline-flex"
            aria-label="واتساب"
            onClick={() => openWhatsAppChat()}
          >
            <MessageCircle size={20} />
          </button>
          <Link
            to="/cart"
            className="relative rounded-xl p-2 hover:bg-mist"
            aria-label={`سلة التسوق${count > 0 ? `، ${count} منتجات` : ''}`}
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
          className="border-t border-mist bg-surface px-4 py-3 sm:px-6"
        >
          <div className="mx-auto flex max-w-7xl gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن أداة مطبخ..."
              className="w-full rounded-xl border border-mist bg-paper px-4 py-2.5 text-sm outline-none focus:border-accent"
              aria-label="بحث عن المنتجات"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
            >
              بحث
            </button>
          </div>
        </form>
      )}

      <MobileMenu open={menuOpen} links={navLinks} onClose={() => setMenuOpen(false)} />
    </header>
  )
}
