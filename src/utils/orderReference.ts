export function formatOrderReference(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('Order number is out of range.')
  }
  return `MH-${String(sequence).padStart(6, '0')}`
}

export function formatOrderDate(date: Date, locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
