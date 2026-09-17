export type Locale = 'ar' | 'en'

export interface LocalizedText {
  ar: string
  en: string
}

export const localeMeta: Record<
  Locale,
  { label: string; dir: 'rtl' | 'ltr'; htmlLang: string; ogLocale: string }
> = {
  ar: { label: 'العربية', dir: 'rtl', htmlLang: 'ar', ogLocale: 'ar_EG' },
  en: { label: 'English', dir: 'ltr', htmlLang: 'en', ogLocale: 'en_US' },
}

export const LOCALE_STORAGE_KEY = 'modern-home-locale'

export function isLocale(value: unknown): value is Locale {
  return value === 'ar' || value === 'en'
}

export function localized(value: LocalizedText, locale: Locale): string {
  return value[locale] || value.ar
}
