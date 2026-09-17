import { useLocale } from '../../hooks/useLocale'

interface LoadingProps {
  label?: string
}

export default function Loading({ label }: LoadingProps) {
  const { t } = useLocale()
  const text = label ?? t('common.loading')

  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-muted" role="status">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-mist border-t-accent" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="@container animate-pulse overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card">
      <div className="aspect-[4/5] bg-mist" />
      <div className="space-y-2.5 p-2.5 @[16rem]:space-y-3 @[16rem]:p-4">
        <div className="h-3 w-1/3 rounded bg-mist" />
        <div className="h-4 w-4/5 rounded bg-mist" />
        <div className="h-5 w-1/2 rounded bg-mist" />
        <div className="flex gap-1.5 @[16rem]:flex-col @[16rem]:gap-2">
          <div className="h-9 min-w-0 flex-1 rounded-xl bg-mist @[16rem]:h-10 @[16rem]:w-full" />
          <div className="flex shrink-0 gap-1.5 @[16rem]:grid @[16rem]:w-full @[16rem]:grid-cols-2">
            <div className="size-9 rounded-xl bg-mist @[16rem]:h-10 @[16rem]:w-full" />
            <div className="size-9 rounded-xl bg-mist @[16rem]:h-10 @[16rem]:w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
