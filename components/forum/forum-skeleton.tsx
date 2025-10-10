import { Skeleton } from '@/components/ui/skeleton';

export function ForumSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-6 rounded-3xl border border-muted/60 bg-muted/20 p-6">
            <div className="flex flex-col gap-3 w-full">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        ))}
      </section>
      <aside className="space-y-4 rounded-3xl border border-muted/60 bg-muted/30 p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-32" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-5 w-44" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
      </aside>
    </div>
  );
}
