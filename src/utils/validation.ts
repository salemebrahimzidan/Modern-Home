import { translate } from '../i18n/translate'
import type { Locale } from '../i18n/types'

export function isValidEgyptianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '')
  return /^(?:\+?20|0)?1[0125]\d{8}$/.test(cleaned)
}

export function validateCustomerForm(
  input: {
    name: string
    phone: string
    address: string
  },
  locale: Locale = 'ar',
): Partial<Record<'name' | 'phone' | 'address', string>> {
  const errors: Partial<Record<'name' | 'phone' | 'address', string>> = {}

  if (!input.name.trim()) {
    errors.name = translate(locale, 'validation.nameRequired')
  }

  if (!input.phone.trim()) {
    errors.phone = translate(locale, 'validation.phoneRequired')
  } else if (!isValidEgyptianPhone(input.phone)) {
    errors.phone = translate(locale, 'validation.phoneInvalid')
  }

  if (!input.address.trim()) {
    errors.address = translate(locale, 'validation.addressRequired')
  }

  return errors
}
