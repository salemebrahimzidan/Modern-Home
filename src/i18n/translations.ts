import ar from './ar.json'
import en from './en.json'

export const messages = { ar, en }

export type Messages = typeof ar

type Join<K, P> = K extends string
  ? P extends string
    ? `${K}${P extends '' ? '' : '.'}${P}`
    : never
  : never

type Leaves<T> = T extends string
  ? ''
  : {
      [K in keyof T & string]: Join<K, Leaves<T[K]>>
    }[keyof T & string]

export type TranslationKey = Leaves<Messages>
