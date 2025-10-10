import { Skeleton } from '@/components/ui/skeleton';

export function ProfileFeedSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <section className="space-y-6">
        <div className="card space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-muted/60">
            <Skeleton className="aspect-video w-full" />
            <div className="space-y-3 bg-surface/70 p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-36 rounded-full" />
            </div>
          </div>
        ))}
      </section>
      <aside className="card space-y-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </aside>
    </div>
  );
}
