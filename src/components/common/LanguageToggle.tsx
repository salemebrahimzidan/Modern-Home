import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { localeMeta, type Locale } from '../../i18n/types'

const OPTIONS: Locale[] = ['ar', 'en']

export default function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function select(next: Locale) {
    setLocale(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold text-muted hover:bg-mist hover:text-ink"
        aria-label={t('language.switcher')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span lang={locale} dir={localeMeta[locale].dir}>
          {t(locale === 'ar' ? 'language.ar' : 'language.en')}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-label={t('language.switcher')}
          className="absolute end-0 z-50 mt-1 min-w-36 overflow-hidden rounded-xl border border-mist bg-surface py-1 shadow-soft"
        >
          {OPTIONS.map((code) => {
            const selected = locale === code
            return (
              <li key={code} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  lang={localeMeta[code].htmlLang}
                  dir={localeMeta[code].dir}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-mist ${
                    selected ? 'font-semibold text-accent' : 'text-ink'
                  }`}
                  onClick={() => select(code)}
                >
                  {t(code === 'ar' ? 'language.ar' : 'language.en')}
                  {selected && <Check size={14} className="shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
