import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RoomsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-full" />
        <Skeleton className="h-4 w-64 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="rounded-3xl border border-muted/40 bg-muted/10 p-5">
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3 rounded-full" />
              <Skeleton className="h-4 w-1/2 rounded-full" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
