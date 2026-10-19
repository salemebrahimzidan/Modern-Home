import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLocale } from '../../hooks/useLocale'

export default function DirectionalArrow({ size = 16 }: { size?: number }) {
  const { locale } = useLocale()
  const Icon = locale === 'ar' ? ArrowLeft : ArrowRight
  return <Icon size={size} aria-hidden />
}
