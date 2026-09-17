import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { translate, type TranslateVars } from '../i18n/translate'
import type { TranslationKey } from '../i18n/translations'
import {
  isLocale,
  localeMeta,
  LOCALE_STORAGE_KEY,
  type Locale,
} from '../i18n/types'
import { getStorageItem, setStorageItem } from '../utils/storage'

export interface LocaleContextValue {
  locale: Locale
  dir: 'rtl' | 'ltr'
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: (key: TranslationKey, vars?: TranslateVars) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readStoredLocale(): Locale {
  const stored = getStorageItem<unknown>(LOCALE_STORAGE_KEY, 'ar')
  return isLocale(stored) ? stored : 'ar'
}

function applyDocumentLocale(locale: Locale): void {
  const meta = localeMeta[locale]
  document.documentElement.lang = meta.htmlLang
  document.documentElement.dir = meta.dir

  const og = document.querySelector('meta[property="og:locale"]')
  if (og) og.setAttribute('content', meta.ogLocale)
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale())

  useEffect(() => {
    applyDocumentLocale(locale)
    setStorageItem(LOCALE_STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => (current === 'ar' ? 'en' : 'ar'))
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: TranslateVars) => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: localeMeta[locale].dir,
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, toggleLocale, t],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return ctx
}
