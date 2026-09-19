import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import Footer from './Footer'
import Navbar from './Navbar'
import { FloatingWhatsAppButton } from '../common/WhatsAppButton'
import ToastViewport from '../common/ToastViewport'
import { useLocale } from '../../hooks/useLocale'

export default function MainLayout({ children }: { children: ReactNode }) {
  const { t } = useLocale()
  const { pathname } = useLocation()
  const onePage = pathname === '/contact' || pathname === '/about'

  return (
    <div
      className={[
        'flex max-w-[100vw] flex-col overflow-x-clip',
        onePage ? 'h-svh overflow-hidden' : 'min-h-svh',
      ].join(' ')}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        {t('common.skipToContent')}
      </a>
      <Navbar />
      <main
        id="main-content"
        className={onePage ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden' : 'min-w-0 flex-1'}
      >
        {children}
      </main>
      <Footer />
      <FloatingWhatsAppButton />
      <ToastViewport />
      <Link to="/cart" className="sr-only">
        {t('common.cart')}
      </Link>
    </div>
  )
}
