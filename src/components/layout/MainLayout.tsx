import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import Footer from './Footer'
import Navbar from './Navbar'
import { FloatingWhatsAppButton } from '../common/WhatsAppButton'
import ToastViewport from '../common/ToastViewport'
import { useLocale } from '../../hooks/useLocale'
import { useCart } from '../../hooks/useCart'
import { useEffect } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  const { t, locale } = useLocale()
  const { getCartItemsCount } = useCart()
  const { pathname, hash } = useLocation()
  const onePage = false
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView(),
      )
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return (
    <div
      className={[
        'flex max-w-[100vw] flex-col overflow-x-clip',
        pathname.startsWith('/products/') ? 'has-purchase-dock' : '',
        onePage ? 'h-svh overflow-hidden' : 'min-h-svh',
      ].join(' ')}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        {t('common.skipToContent')}
      </a>
      <div className="sticky top-0 z-40">
        <Navbar />
      </div>
      <main
        id="main-content"
        className={
          onePage
            ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
            : 'min-w-0 flex-1'
        }
      >
        {children}
      </main>
      <Footer />
      <FloatingWhatsAppButton />
      {pathname !== '/cart' && !pathname.startsWith('/products/') && (
        <nav
          className="mobile-shopping-bar"
          aria-label={locale === 'ar' ? 'التسوق السريع' : 'Quick shopping'}
        >
          <Link to="/products">{t('nav.products')}</Link>
          <Link to="/cart">
            {t('common.cart')} · {getCartItemsCount()} ←
          </Link>
        </nav>
      )}
      <ToastViewport />
      <Link to="/cart" className="sr-only">
        {t('common.cart')}
      </Link>
    </div>
  )
}
