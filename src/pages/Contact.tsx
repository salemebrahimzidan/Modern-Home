import { type ReactNode } from 'react'
import WhatsAppIcon from '../components/common/WhatsAppIcon'
import { storeConfig } from '../config/store'
import { useLocale } from '../hooks/useLocale'
import { usePageSeo } from '../hooks/usePageSeo'
import { unsplashPhoto } from '../utils/images'
import { openWhatsAppChat } from '../utils/whatsapp'

export default function Contact() {
  const { t } = useLocale()
  usePageSeo(t('contact.seoTitle'), t('contact.seoDescription'))

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden text-white">
        <img
          src={unsplashPhoto('photo-1556912173-46c336c7fd55', { width: 1800, height: 1000 })}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-ink/94 via-[#2c1c14]/86 to-accent/35" />
        <div className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />

        <div className="relative w-full px-6 py-8 sm:px-10 sm:py-10 md:px-14 lg:px-16">
          <h1 className="max-w-xl font-display text-3xl font-bold leading-tight sm:text-4xl">
            {t('contact.title')}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
            {t('contact.description')}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <IconLink href={`tel:${storeConfig.phone}`} label={t('contact.phone')} className="bg-accent">
              <PhoneIcon />
            </IconLink>
            <button
              type="button"
              onClick={() => openWhatsAppChat()}
              aria-label={t('common.whatsapp')}
              className="inline-flex"
            >
              <BrandTile className="bg-[#25D366]">
                <WhatsAppIcon size={20} />
              </BrandTile>
            </button>
            <IconLink href={storeConfig.facebook} label={t('common.facebook')} className="bg-[#1877F2]" external>
              <FacebookIcon />
            </IconLink>
            <IconLink
              href={storeConfig.instagram}
              label={t('common.instagram')}
              className="bg-[linear-gradient(45deg,#f58529_0%,#dd2a7b_52%,#8134af_100%)]"
              external
            >
              <InstagramIcon />
            </IconLink>
            <IconLink href={storeConfig.tiktok} label={t('common.tiktok')} className="bg-black" external>
              <TikTokIcon />
            </IconLink>
          </div>
        </div>
      </header>
    </section>
  )
}

function IconLink({
  href,
  label,
  className,
  external,
  children,
}: {
  href: string
  label: string
  className: string
  external?: boolean
  children: ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      <BrandTile className={className}>{children}</BrandTile>
    </a>
  )
}

function BrandTile({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] ring-1 ring-white/15 transition duration-200 hover:scale-105 hover:ring-white/40 ${className}`}
    >
      {children}
    </span>
  )
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2Z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14.5 8.5V6.8c0-.74.5-1.3 1.6-1.3h1.4V3h-2.3C12.3 3 11 4.5 11 6.6V8.5H8.5V11H11v10h3.5V11H17l.5-2.5h-3Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.15" cy="6.85" r="1.15" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon() {
  const note =
    'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#25F4EE" d={note} transform="translate(1.05 0.2)" />
      <path fill="#FE2C55" d={note} transform="translate(-1.05 -0.2)" />
      <path fill="#fff" d={note} />
    </svg>
  )
}
