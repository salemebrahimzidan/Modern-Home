import { useEffect } from 'react'
import { storeConfig } from '../config/store'

export function usePageSeo(title: string, description?: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} | ${storeConfig.name}`

    let meta = document.querySelector('meta[name="description"]')
    const previousDescription = meta?.getAttribute('content') ?? null

    if (description) {
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }

    return () => {
      document.title = previous
      if (meta && previousDescription !== null) {
        meta.setAttribute('content', previousDescription)
      }
    }
  }, [title, description])
}
