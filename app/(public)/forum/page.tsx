import { ForumOverview } from '@/components/forum/forum-overview';
import { FeatureGate } from '@/components/shared/feature-gate';
import { fetchForumCategories, fetchForumThreads } from '@/lib/api';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Foro | TKN Social'
};

export default async function ForumPage() {
  const [tForum, categories, threads] = await Promise.all([
    getTranslations('forum'),
    fetchForumCategories(),
    fetchForumThreads()
  ]);
  return (
    <FeatureGate flag="FEATURE_FORUM" fallback={<p>El foro está deshabilitado.</p>}>
      <div className="flex flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-text">{tForum('categories')}</h1>
          <p className="text-sm text-text-muted">Moderación activa, adjuntos privados y reportes rápidos.</p>
        </header>
        <ForumOverview categories={categories} threads={threads} />
      </div>
    </FeatureGate>
  );
}
