import { messages, type TranslationKey } from './translations'
import type { Locale } from './types'

export type TranslateVars = Record<string, string | number>

function lookup(locale: Locale, key: TranslationKey): string {
  const parts = key.split('.')
  let node: unknown = messages[locale]

  for (const part of parts) {
    if (!node || typeof node !== 'object' || !(part in node)) {
      node = messages.ar
      for (const fallbackPart of parts) {
        if (!node || typeof node !== 'object' || !(fallbackPart in node)) {
          return key
        }
        node = (node as Record<string, unknown>)[fallbackPart]
      }
      break
    }
    node = (node as Record<string, unknown>)[part]
  }

  return typeof node === 'string' ? node : key
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: TranslateVars,
): string {
  let text = lookup(locale, key)
  if (!vars) return text

  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value))
  }
  return text
}
