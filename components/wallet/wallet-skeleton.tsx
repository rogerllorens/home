import { Skeleton } from '@/components/ui/skeleton';

export function WalletSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <section className="space-y-4">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-3xl border border-muted/60 bg-muted/20 p-5">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((__, subIndex) => (
                <Skeleton key={subIndex} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </section>
      <aside className="space-y-4 rounded-3xl border border-muted/60 bg-muted/30 p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </aside>
    </div>
  );
}
