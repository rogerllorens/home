import { notFound } from 'next/navigation';
import { fetchForumThread } from '@/lib/api';
import { ThreadDetail } from '@/components/forum/thread-detail';

interface ThreadPageProps {
  params: { threadId: string };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const thread = await fetchForumThread(params.threadId);
  if (!thread) {
    notFound();
  }

  return <ThreadDetail thread={thread} />;
}
