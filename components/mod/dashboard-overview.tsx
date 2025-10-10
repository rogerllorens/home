'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchAdminDashboard, queryKeys } from '@/lib/api';
import { formatNumberCompact, formatTokens } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

export function DashboardOverview() {
  const t = useTranslations('admin.dashboard');
  const { data, isLoading } = useQuery({ queryKey: queryKeys.adminDashboard, queryFn: fetchAdminDashboard });

  const metrics = useMemo(() => {
    if (!data) return [];
    return [
      { key: 'dau', value: data.dau.toLocaleString('es-ES'), label: t('metrics.dau') },
      { key: 'tokensPurchased', value: formatTokens(data.tokensPurchased), label: t('metrics.purchased') },
      { key: 'tokensSpent', value: formatTokens(data.tokensSpent), label: t('metrics.spent') },
      { key: 'gmv', value: formatTokens(data.gmvTokens), label: t('metrics.gmv') },
      { key: 'gsv', value: formatTokens(data.gsvTokens), label: t('metrics.gsv') },
      { key: 'fee', value: formatTokens(data.platformFee), label: t('metrics.fee') },
      {
        key: 'conversion',
        value: `${(data.packConversion * 100).toFixed(1)}%`,
        label: t('metrics.conversion')
      },
      {
        key: 'guestToUserConversion',
        value: `${(data.guestToUserConversion * 100).toFixed(1)}%`,
        label: 'Invitado → usuario'
      },
      {
        key: 'userToBuyerConversion',
        value: `${(data.userToBuyerConversion * 100).toFixed(1)}%`,
        label: 'Usuario → comprador'
      },
      {
        key: 'forumActiveUsers',
        value: formatNumberCompact(data.forumActiveUsers),
        label: 'Usuarios activos foro'
      },
      {
        key: 'chargebackRate',
        value: `${(data.chargebackRate * 100).toFixed(2)}%`,
        label: 'Chargeback rate'
      },
      {
        key: 'highRiskPurchasers',
        value: data.highRiskPurchasers.toString(),
        label: 'Compradores en riesgo'
      },
      {
        key: 'spendLimitBreaches',
        value: data.spendLimitBreaches.toString(),
        label: 'Excesos de límite'
      }
    ];
  }, [data, t]);

  if (isLoading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.key} className="rounded-3xl bg-surface/60">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {data.charts.map((chart) => {
          const maxValue = Math.max(
            ...chart.points.map((point) => Math.max(point.purchases, point.spends)),
            1
          );
          return (
            <Card key={chart.period} className="rounded-3xl bg-surface/60">
              <CardHeader>
                <CardTitle className="text-lg">{t('charts.title', { period: chart.period })}</CardTitle>
                <CardDescription>{t('charts.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-end gap-2">
                  {chart.points
                    .slice()
                    .reverse()
                    .map((point) => {
                      const purchaseHeight = Math.max((point.purchases / maxValue) * 100, 4);
                      const spendHeight = Math.max((point.spends / maxValue) * 100, 4);
                      const purchasesLabel = point.purchases.toLocaleString('es-ES');
                      const spendLabel = point.spends.toLocaleString('es-ES');
                      return (
                        <div key={point.timestamp} className="flex h-full w-full items-end gap-1">
                          <div
                            className="w-full rounded-t-lg bg-accent"
                            style={{ height: `${purchaseHeight}%` }}
                            aria-label={t('charts.purchases', { value: purchasesLabel })}
                          />
                          <div
                            className="w-full rounded-t-lg bg-accent-2/80"
                            style={{ height: `${spendHeight}%` }}
                            aria-label={t('charts.spends', { value: spendLabel })}
                          />
                        </div>
                      );
                    })}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-6 rounded-full bg-accent" />
                    {t('charts.legendPurchases')}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-6 rounded-full bg-accent-2/80" />
                    {t('charts.legendSpends')}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section>
        <Card className="rounded-3xl bg-surface/60">
          <CardHeader>
            <CardTitle>{t('sources.title')}</CardTitle>
            <CardDescription>{t('sources.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {data.topSources.map((source) => (
                <li key={source.source} className="flex items-center justify-between text-sm">
                  <span className="font-semibold capitalize">{source.source}</span>
                  <span className="text-text-muted">{(source.percent * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl bg-surface/60">
          <CardHeader>
            <CardTitle>Reparto de gasto</CardTitle>
            <CardDescription>Distribución de créditos (TKN) gastados por funcionalidad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Gifts</span>
              <span>{(data.tokenSpendBreakdown.gifts * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>PPV</span>
              <span>{(data.tokenSpendBreakdown.ppv * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pases 30 días</span>
              <span>{(data.tokenSpendBreakdown.passes * 100).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl bg-surface/60">
          <CardHeader>
            <CardTitle>Top referidores</CardTitle>
            <CardDescription>Usuarios que más tráfico convertido generan.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {data.topReferrers.map((referrer) => (
                <li key={referrer.username} className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-2">
                  <span>@{referrer.username}</span>
                  <span className="text-text-muted">
                    {referrer.referrals} · {formatTokens(referrer.tokensEarned)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
      <section>
        <Card className="rounded-3xl bg-surface/60">
          <CardHeader>
            <CardTitle>Posts más compartidos</CardTitle>
            <CardDescription>Clicks externos que vuelven a la plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {data.topSharedPosts.map((post) => (
                <li key={post.id} className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-2">
                  <span className="line-clamp-1">{post.title}</span>
                  <span className="text-text-muted">{formatNumberCompact(post.externalClicks)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
      <section>
        <Card className="rounded-3xl bg-surface/60">
          <CardHeader>
            <CardTitle>Alertas de chargeback</CardTitle>
            <CardDescription>Usuarios con devoluciones recientes para seguimiento manual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.chargebackAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between rounded-2xl border border-muted/40 bg-muted/30 px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-semibold">@{alert.username}</span>
                  <span className="text-xs text-text-muted">
                    {alert.incidents} incidentes · {formatTokens(alert.amountTokens)} · Último {new Date(alert.lastIncidentAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <Badge variant={alert.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                  {alert.riskLevel === 'high' ? 'Alto' : 'Medio'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
