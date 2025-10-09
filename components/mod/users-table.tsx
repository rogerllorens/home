'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchAdminUsers, queryKeys } from '@/lib/api';
import { formatTokens } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

export function UsersTable() {
  const t = useTranslations('admin.users');
  const { data, isLoading } = useQuery(queryKeys.adminUsers, fetchAdminUsers);

  const onAction = (username: string, action: 'ban' | 'shadowban' | 'unban') => {
    toast.success(t('toast', { username, action: t(`actions.${action}`) }));
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
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-muted/60 text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-text-muted">
              <tr>
                <th className="px-4 py-3">{t('table.user')}</th>
                <th className="px-4 py-3">{t('table.created')}</th>
                <th className="px-4 py-3">{t('table.balance')}</th>
                <th className="px-4 py-3">{t('table.earnings')}</th>
                <th className="px-4 py-3">Riesgo</th>
                <th className="px-4 py-3">{t('table.flags')}</th>
                <th className="px-4 py-3">{t('table.reports')}</th>
                <th className="px-4 py-3 text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/40">
              {data.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">@{user.username}</span>
                      <span className="text-xs text-text-muted">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(user.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatTokens(user.balance)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs">
                      <span>{t('earnings.pending', { value: formatTokens(user.pending) })}</span>
                      <span>{t('earnings.available', { value: formatTokens(user.available) })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    <div className="flex flex-col gap-1">
                      <span>
                        Chargebacks: <strong>{(user.chargebackRate * 100).toFixed(1)}%</strong>
                      </span>
                      {user.flags.purchasesSuspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warn/20 px-3 py-1 text-warn">
                          Compras suspendidas
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.flags.ban ? <Badge variant="destructive">{t('flags.ban')}</Badge> : null}
                      {user.flags.shadowban ? (
                        <Badge className="bg-accent-2/40 text-accent-2">{t('flags.shadowban')}</Badge>
                      ) : null}
                      {!user.flags.ban && !user.flags.shadowban ? (
                        <Badge variant="outline" className="border-muted/40 text-text-muted">
                          {t('flags.clean')}
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={user.reports > 3 ? 'destructive' : 'secondary'}>{user.reports}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onAction(user.username, 'ban')}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        {t('actions.ban')}
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onAction(user.username, 'shadowban')}
                        className="border-accent-2/40 text-accent-2 hover:bg-accent-2/10"
                      >
                        {t('actions.shadowban')}
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className={
                          user.flags.purchasesSuspended
                            ? 'border-success/40 text-success hover:bg-success/10'
                            : 'border-warn/40 text-warn hover:bg-warn/10'
                        }
                        onClick={() =>
                          toast.success(
                            user.flags.purchasesSuspended ? 'Compras reactivadas' : 'Compras suspendidas',
                            { description: `@${user.username}` }
                          )
                        }
                      >
                        {user.flags.purchasesSuspended ? 'Reactivar compras' : 'Suspender compras'}
                      </Button>
                      <Button size="xs" onClick={() => onAction(user.username, 'unban')}>
                        {t('actions.unban')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
