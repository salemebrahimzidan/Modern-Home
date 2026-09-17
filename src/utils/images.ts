export function unsplashPhoto(
  id: string,
  size: { width?: number; height?: number } = {},
): string {
  const width = size.width ?? 1000
  const heightQuery = size.height ? `&h=${size.height}` : ''
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}${heightQuery}&q=80`
}

export const FALLBACK_IMAGE = unsplashPhoto('photo-1556912173-46c336c7fd55')
