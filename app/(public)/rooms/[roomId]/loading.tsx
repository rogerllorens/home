import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function MassiveRoomLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-60 rounded-full" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="rounded-3xl border border-muted/40 bg-muted/10 p-5">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-1/3 rounded-full" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="space-y-3 rounded-3xl border border-muted/40 bg-muted/10 p-4">
            <Skeleton className="h-5 w-1/2 rounded-full" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-9 w-full rounded-full" />
          </Card>
          <Card className="space-y-3 rounded-3xl border border-muted/40 bg-muted/10 p-4">
            <Skeleton className="h-5 w-1/2 rounded-full" />
            <Skeleton className="h-9 w-full rounded-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
