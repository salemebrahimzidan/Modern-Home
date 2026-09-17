interface LoadingProps {
  label?: string
}

export default function Loading({ label = 'جاري التحميل...' }: LoadingProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-muted" role="status">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-mist border-t-accent" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-surface shadow-card">
      <div className="aspect-[4/5] bg-mist" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded bg-mist" />
        <div className="h-4 w-2/3 rounded bg-mist" />
        <div className="h-4 w-1/2 rounded bg-mist" />
        <div className="h-10 w-full rounded-xl bg-mist" />
      </div>
    </div>
  )
}
