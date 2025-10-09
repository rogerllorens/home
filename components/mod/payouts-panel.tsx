'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { fetchAdminPayouts, queryKeys } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { formatTokens } from '@/lib/utils';
import { payoutDecisionSchema } from '@/lib/validators';

type Mode = 'approve' | 'reject';

type DecisionForm = {
  reference: string;
  note?: string;
};

export function PayoutsPanel() {
  const t = useTranslations('admin.payouts');
  const { data, isLoading } = useQuery(queryKeys.adminPayouts, fetchAdminPayouts);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('approve');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const request = useMemo(() => data?.find((item) => item.id === selectedId), [data, selectedId]);

  const form = useForm<DecisionForm>({
    resolver: zodResolver(payoutDecisionSchema),
    defaultValues: { reference: '', note: '' }
  });

  const openModal = (id: string, nextMode: Mode) => {
    setSelectedId(id);
    setMode(nextMode);
    form.reset({ reference: '', note: '' });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit((values) => {
    if (!request) return;
    toast.success(
      mode === 'approve'
        ? t('toast.approved', { id: request.id, reference: values.reference })
        : t('toast.rejected', { id: request.id })
    );
    setModalOpen(false);
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Card className="rounded-3xl bg-surface/60">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-muted/60 text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-text-muted">
                <tr>
                  <th className="px-4 py-3">{t('table.user')}</th>
                  <th className="px-4 py-3">{t('table.amount')}</th>
                  <th className="px-4 py-3">{t('table.method')}</th>
                  <th className="px-4 py-3">{t('table.status')}</th>
                  <th className="px-4 py-3">{t('table.requested')}</th>
                  <th className="px-4 py-3">{t('table.reference')}</th>
                  <th className="px-4 py-3 text-right">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/40">
                {data.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold">@{item.user}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span>{formatTokens(item.amountTokens)}</span>
                        <span className="text-xs text-text-muted">≈ {item.euroEquivalent.toFixed(2)} €</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase tracking-wide text-text-muted">{item.method}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          item.status === 'requested'
                            ? 'warn'
                            : item.status === 'paid'
                            ? 'success'
                            : 'destructive'
                        }
                      >
                        {t(`status.${item.status}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(item.requestedAt).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {item.reference ?? t('noReference')}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'requested' ? (
                        <div className="flex justify-end gap-2">
                          <Button size="xs" onClick={() => openModal(item.id, 'approve')}>
                            {t('actions.approve')}
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => openModal(item.id, 'reject')}
                          >
                            {t('actions.reject')}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-text-muted">
                          {item.processedAt
                            ? t('processedAt', {
                                date: new Date(item.processedAt).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short'
                                })
                              })
                            : item.reason ?? '—'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={mode === 'approve' ? t('modal.approveTitle') : t('modal.rejectTitle')}
        description={
          request
            ? t('modal.subtitle', { id: request.id, user: request.user, amount: formatTokens(request.amountTokens) })
            : undefined
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
              {t('form.reference')}
            </label>
            <Input {...form.register('reference')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
              {t('form.note')}
            </label>
            <Input {...form.register('note')} placeholder={t('form.optional')} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" className={mode === 'reject' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : undefined}>
              {mode === 'approve' ? t('actions.confirmApprove') : t('actions.confirmReject')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
