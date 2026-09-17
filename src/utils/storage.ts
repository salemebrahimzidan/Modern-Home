const isBrowser = typeof window !== 'undefined'

export function getStorageItem<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (!isBrowser) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota / private mode errors
  }
}

export function removeStorageItem(key: string): void {
  if (!isBrowser) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore
  }
}
