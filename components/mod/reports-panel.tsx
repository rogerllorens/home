'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { fetchAdminReports, queryKeys } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

const statuses: ('OPEN' | 'REVIEW' | 'CLOSED')[] = ['OPEN', 'REVIEW', 'CLOSED'];

export function ReportsPanel() {
  const t = useTranslations('admin.reports');
  const { data, isLoading } = useQuery(queryKeys.adminReports, fetchAdminReports);
  const [selected, setSelected] = useState<(typeof statuses)[number]>('OPEN');

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((report) => report.status === selected);
  }, [data, selected]);

  const onResolve = (id: string, action: 'close' | 'takedown' | 'ban' | 'shadowban') => {
    toast.info(t('toast', { id, action: t(`actions.${action}`) }));
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
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          tabs={statuses.map((status) => ({
            id: status,
            label: t(`status.${status.toLowerCase() as 'open' | 'review' | 'closed'}`),
            content: (
              <div className="flex flex-col gap-4">
                {filtered.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-muted/60 px-6 py-10 text-center text-sm text-text-muted">
                    {t('empty')}
                  </p>
                ) : (
                  filtered.map((report) => (
                    <article
                      key={report.id}
                      className="grid gap-4 rounded-3xl border border-muted/40 bg-bg/40 p-4 transition hover:border-accent/40 lg:grid-cols-[240px_1fr]"
                    >
                      <div className="space-y-3">
                        <Badge variant="outline" className="uppercase tracking-widest">
                          {t(`target.${report.targetType}`)} #{report.targetId}
                        </Badge>
                        <p className="text-sm text-text-muted">{report.reason}</p>
                        <p className="text-xs text-text-muted/80">
                          {t('reportedAt', {
                            date: new Date(report.createdAt).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          })}
                        </p>
                        <Badge variant={report.count > 5 ? 'destructive' : 'warn'}>
                          {t('reportsCount', { count: report.count })}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-4">
                        {report.preview?.thumbnail ? (
                          <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-muted/40">
                            <Image
                              src={report.preview.thumbnail}
                              alt={t('previewAlt', { target: report.targetId })}
                              fill
                              className={report.preview.blurred ? 'object-cover blur-sm' : 'object-cover'}
                            />
                          </div>
                        ) : null}
                        {report.preview?.metadata ? (
                          <p className="text-xs text-text-muted">{report.preview.metadata}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => onResolve(report.id, 'close')}>
                            {t('actions.close')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onResolve(report.id, 'takedown')}
                          >
                            {t('actions.takedown')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => onResolve(report.id, 'ban')}
                          >
                            {t('actions.ban')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-accent-2/40 text-accent-2 hover:bg-accent-2/10"
                            onClick={() => onResolve(report.id, 'shadowban')}
                          >
                            {t('actions.shadowban')}
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )
          }))}
          selected={selected}
          onChange={setSelected}
        />
      </CardContent>
    </Card>
  );
}
