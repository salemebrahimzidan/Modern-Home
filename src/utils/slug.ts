/** Same rule as categories_slug_format and products_slug_format. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}

export type SlugResolution =
  | { ok: true; slug: string }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'duplicate'; slug: string }

export function resolveSlug(source: string, taken: readonly string[]): SlugResolution {
  const slug = slugify(source)
  if (!isValidSlug(slug)) return { ok: false, reason: 'invalid' }
  if (taken.includes(slug)) return { ok: false, reason: 'duplicate', slug }
  return { ok: true, slug }
}

export type SlugConstraintViolation = 'invalid' | 'duplicate'

export function slugConstraintViolation(cause: unknown): SlugConstraintViolation | null {
  if (!cause || typeof cause !== 'object') return null

  const record = cause as { code?: unknown; message?: unknown; details?: unknown }
  const code = typeof record.code === 'string' ? record.code : ''
  const text = [record.message, record.details]
    .filter((part): part is string => typeof part === 'string')
    .join(' ')

  if (code === '23514' && text.includes('slug_format')) return 'invalid'
  if (code === '23505' && (text.includes('slug_unique') || text.includes('(slug)'))) {
    return 'duplicate'
  }
  return null
}

export function catalogWriteMessage(
  cause: unknown,
  copy: { invalid: string; duplicate: string },
): string {
  const violation = slugConstraintViolation(cause)
  if (violation === 'invalid') return copy.invalid
  if (violation === 'duplicate') return copy.duplicate
  if (cause instanceof Error && cause.message) return cause.message
  if (cause && typeof cause === 'object' && 'message' in cause) {
    const message = (cause as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return 'Request failed'
}
