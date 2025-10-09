import { ForumSkeleton } from '@/components/forum/forum-skeleton';

export default function ForumLoading() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <div className="h-8 w-48 rounded-xl bg-muted/60" />
        <div className="h-4 w-64 rounded-xl bg-muted/40" />
      </header>
      <ForumSkeleton />
    </div>
  );
}
