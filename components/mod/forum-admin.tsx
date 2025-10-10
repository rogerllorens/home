'use client';

import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { fetchAdminForum, queryKeys } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface NewCategoryForm {
  name: string;
  moderator: string;
}

export function ForumAdminPanel() {
  const t = useTranslations('admin.forum');
  const { data, isLoading } = useQuery({ queryKey: queryKeys.adminForum, queryFn: fetchAdminForum });
  const form = useForm<NewCategoryForm>({ defaultValues: { name: '', moderator: '' } });

  const onSubmit = form.handleSubmit((values) => {
    toast.success(t('toast.created', { name: values.name }));
    form.reset();
  });

  const onTogglePin = (id: string, pinned: boolean) => {
    toast.info(t(pinned ? 'toast.unpinned' : 'toast.pinned', { id }));
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card className="rounded-3xl bg-surface/60">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((category) => (
              <div key={category.id} className="flex flex-col gap-3 rounded-3xl border border-muted/40 bg-bg/40 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-sm font-semibold">{category.name}</h4>
                  <p className="text-xs text-text-muted">
                    {t('threads', { count: category.threads })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted/80">
                    {category.moderators.map((mod) => (
                      <Badge key={mod} variant="secondary" className="bg-muted/30 px-2 py-1 normal-case">
                        @{mod}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  {category.isPinned ? (
                    <Badge variant="outline" className="uppercase tracking-widest text-accent">
                      {t('pinned')}
                    </Badge>
                  ) : null}
                  <Button size="xs" variant="outline" onClick={() => onTogglePin(category.id, category.isPinned)}>
                    {category.isPinned ? t('actions.unpin') : t('actions.pin')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl bg-surface/60">
        <CardHeader>
          <CardTitle>{t('create.title')}</CardTitle>
          <CardDescription>{t('create.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                {t('create.name')}
              </label>
              <Input {...form.register('name', { required: true, minLength: 3 })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                {t('create.moderator')}
              </label>
              <Input {...form.register('moderator')} placeholder="@username" />
            </div>
            <Button type="submit">{t('create.submit')}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
