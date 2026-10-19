import type { LocalizedText } from '../i18n/types'

export interface Category {
  id: string
  name: LocalizedText
  slug: string
  image: string
  description?: LocalizedText
}
