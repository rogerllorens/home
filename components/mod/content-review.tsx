'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { fetchAdminContent, MediaVisibility, queryKeys } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTokens } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

const visibilityOptions: Array<{ value: 'ALL' | MediaVisibility; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: MediaVisibility.FREE, label: 'FREE' },
  { value: MediaVisibility.PPV, label: 'PPV' },
  { value: MediaVisibility.PASS_ONLY, label: 'PASS_ONLY' }
];

export function ContentReview() {
  const t = useTranslations('admin.content');
  const { data, isLoading } = useQuery(queryKeys.adminContent, fetchAdminContent);
  const [selected, setSelected] = useState<'ALL' | MediaVisibility>('ALL');

  const filtered = useMemo(() => {
    if (!data) return [];
    return selected === 'ALL' ? data : data.filter((item) => item.visibility === selected);
  }, [data, selected]);

  const onAction = (id: string, action: 'hide' | 'sensitive' | 'delete') => {
    toast.warning(t('toast', { id, action: t(`actions.${action}`) }));
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Card className="rounded-3xl bg-surface/60">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </div>
        <div className="w-full lg:w-64">
          <Select value={selected} onChange={(event) => setSelected(event.target.value as typeof selected)}>
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === 'ALL' ? t('filters.all') : t(`filters.${option.label.toLowerCase()}`)}
              </option>
            ))}
          </Select>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="flex flex-col gap-3 rounded-3xl border border-muted/40 bg-bg/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">{item.title ?? t('untitled')}</h4>
                <p className="text-xs text-text-muted">@{item.owner}</p>
              </div>
              <Badge variant="outline" className="uppercase tracking-widest">
                {item.visibility}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-text-muted">
              <span>{t('meta.size', { mb: item.sizeMb })}</span>
              <span>·</span>
              <span>
                {t('meta.created', {
                  date: new Date(item.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                })}
              </span>
              {item.priceTokens ? (
                <>
                  <span>·</span>
                  <span>{formatTokens(item.priceTokens)}</span>
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-text-muted/80">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-muted/30 px-2 py-1 normal-case">
                  #{tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={item.status === 'removed' ? 'destructive' : item.status === 'sensitive' ? 'warn' : 'outline'}>
                {t(`status.${item.status}`)}
              </Badge>
              <div className="flex gap-2">
                <Button size="xs" variant="outline" onClick={() => onAction(item.id, 'hide')}>
                  {t('actions.hide')}
                </Button>
                <Button size="xs" variant="outline" onClick={() => onAction(item.id, 'sensitive')}>
                  {t('actions.sensitive')}
                </Button>
                <Button
                  size="xs"
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  onClick={() => onAction(item.id, 'delete')}
                >
                  {t('actions.delete')}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
