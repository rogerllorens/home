'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GuestPurchaseGuard } from '@/components/wallet/guest-purchase-guard';
import { ShareMenu } from '@/components/shared/share-menu';
import { useSession, getTransactionsByDay, getStaticCatalog } from '@/components/session-provider';
import {
  formatTokens,
  euroEquivalent,
  formatFiat,
  formatFiatFromEur,
  calculateEffectiveRate,
  SUPPORTED_CURRENCIES,
  formatNumberCompact,
  CREDIT_RATE_NOTE,
  type CurrencyCode
} from '@/lib/utils';
import { toast } from 'sonner';
import { createWalletCheckout, queryKeys } from '@/lib/api';

export function WalletSummary() {
  const session = useSession();
  const { tokenPacks, renewalPromotions, welcomeGift, couponPrograms } = getStaticCatalog();
  const grouped = getTransactionsByDay(session.transactions);
  const [pendingPack, setPendingPack] = useState<string | null>(null);
  const [showGuard, setShowGuard] = useState(false);
  const [limitsDraft, setLimitsDraft] = useState({
    daily: session.spendingLimits.daily,
    monthly: session.spendingLimits.monthly
  });
  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: createWalletCheckout,
    onSuccess: ({ checkoutUrl, message }) => {
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.success(message ?? 'Checkout generado', {
          description: 'Revisa tu correo para completar la compra.'
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      queryClient.invalidateQueries({ queryKey: queryKeys.walletHistory });
    },
    onError: (error: unknown) => {
      const description =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : 'No pudimos iniciar el checkout. Intenta de nuevo en unos segundos.';
      toast.error('Error al iniciar compra', { description });
    },
    onSettled: () => {
      setPendingPack(null);
    }
  });

  const limitUsage = useMemo(() => {
    const { today, month } = session.spendingUsage;
    return {
      today,
      month,
      dailyRemaining: Math.max(session.spendingLimits.daily - today, 0),
      monthlyRemaining: Math.max(session.spendingLimits.monthly - month, 0)
    };
  }, [session.spendingLimits, session.spendingUsage]);

  const packLookup = useMemo(() => {
    return Object.fromEntries(tokenPacks.map((pack) => [pack.id, pack]));
  }, [tokenPacks]);

  const packInsights = useMemo(() => {
    const enriched = tokenPacks.map((pack) => {
      const effectivePer100 = calculateEffectiveRate(pack.amount, pack.price);
      return { ...pack, effectivePer100 };
    });
    const bestValue = enriched.reduce((acc, pack) => {
      if (!acc) return pack;
      return pack.effectivePer100 < acc.effectivePer100 ? pack : acc;
    }, enriched[0]);
    return {
      enriched,
      bestValueId: bestValue?.id
    };
  }, [tokenPacks]);

  const packAccent: Record<string, string> = {
    'pack-s': 'from-emerald-500/40 via-emerald-500/10 to-transparent',
    'pack-m': 'from-sky-500/30 via-sky-500/10 to-transparent',
    'pack-l': 'from-violet-500/30 via-violet-500/10 to-transparent',
    'pack-xl': 'from-fuchsia-500/30 via-fuchsia-500/10 to-transparent',
    'pack-xxl': 'from-amber-500/30 via-amber-500/10 to-transparent'
  };

  const popularPackId = 'pack-m';

  const handlePurchase = (packId: string) => {
    if (session.scope === 'guest') {
      setPendingPack(packId);
      setShowGuard(true);
      return;
    }
    startPurchase(packId);
  };

  const startPurchase = (packId: string) => {
    if (session.purchasesSuspended) {
      toast.error('Compras temporalmente suspendidas', {
        description: 'Contacta con soporte para reactivar las compras de créditos.'
      });
      return;
    }
    const selectedPack = packLookup[packId];
    if (selectedPack) {
      const projectedDaily = session.spendingUsage.today + selectedPack.amount;
      if (
        session.spendingLimits.daily > 0 &&
        projectedDaily > session.spendingLimits.daily
      ) {
        toast.error('Límite diario alcanzado', {
          description: `Te quedan ${formatTokens(limitUsage.dailyRemaining)} para gastar hoy.`
        });
        return;
      }
      const projectedMonthly = session.spendingUsage.month + selectedPack.amount;
      if (
        session.spendingLimits.monthly > 0 &&
        projectedMonthly > session.spendingLimits.monthly
      ) {
        toast.error('Límite mensual alcanzado', {
          description: `Te quedan ${formatTokens(limitUsage.monthlyRemaining)} disponibles este mes.`
        });
        return;
      }
    }
    setPendingPack(packId);
    purchaseMutation.mutate(packId);
  };

  const confirmGuestPurchase = () => {
    const packToBuy = pendingPack;
    setShowGuard(false);
    if (packToBuy) {
      startPurchase(packToBuy);
    }
  };

  const redirectToUpgrade = () => {
    setShowGuard(false);
    setPendingPack(null);
    window.location.href = '/auth/register?intent=wallet';
  };

  const handleLimitSave = () => {
    session.setSpendingLimits({ daily: limitsDraft.daily, monthly: limitsDraft.monthly });
    toast.success('Límites guardados');
  };

  const handleReferralConversion = () => {
    session.recordReferralConversion();
  };

  const handleProfileBonus = () => {
    const claimed = session.claimBonus(
      'profile-complete',
      100,
      '100 créditos (TKN) añadidos por completar tu perfil.'
    );
    if (!claimed) {
      toast('Bonus ya reclamado', {
        description: 'Este incentivo solo se entrega una vez por cuenta.'
      });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <section className="space-y-4">
        <h2 className="text-lg font-heading font-semibold text-text">Últimos movimientos</h2>
        {grouped.length === 0 ? (
          <p className="text-sm text-text-muted">Aún no registras transacciones.</p>
        ) : (
          grouped.map((group) => (
            <Card key={group.day} className="space-y-3 p-5">
              <h3 className="text-sm font-semibold text-text">{group.day}</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                {group.txs.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-2">
                    <span className="font-semibold text-text">{tx.concept}</span>
                    <span className={tx.delta < 0 ? 'text-warn' : 'text-success'}>
                      {tx.delta < 0 ? '-' : '+'}
                      {formatTokens(Math.abs(tx.delta))}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
      </section>
      <aside className="space-y-5 rounded-3xl border border-muted/60 bg-muted/30 p-6">
        <div>
          <h3 className="text-lg font-semibold text-text">Saldo disponible</h3>
          <p className="mt-2 text-2xl font-heading font-bold text-text">{formatTokens(session.tokenBalance)}</p>
          <p className="text-sm text-text-muted">
            {formatFiat(session.tokenBalance, session.preferredCurrency)} · {euroEquivalent(session.tokenBalance)}
          </p>
          <p className="mt-2 text-xs text-text-muted/80">{CREDIT_RATE_NOTE}</p>
          {session.purchasesSuspended ? (
            <p className="mt-3 rounded-2xl border border-warn/60 bg-warn/10 px-4 py-2 text-xs text-warn">
              Compras bloqueadas por el equipo antifraude. Revisa soporte para reactivar.
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-xs">
          <span className="text-text-muted">Moneda preferida</span>
          <Select
            value={session.preferredCurrency}
            onChange={(event) => session.setPreferredCurrency(event.target.value as CurrencyCode)}
            className="w-28 rounded-xl bg-surface/80 text-sm"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-3">
          {packInsights.enriched.map((pack) => {
            const highlight =
              pack.id === packInsights.bestValueId
                ? 'Mejor valor'
                : pack.id === popularPackId
                ? 'Más popular'
                : null;
            const effectiveLabel = `${formatFiatFromEur(
              pack.effectivePer100,
              session.preferredCurrency
            )} por cada 100 Créditos (TKN)`;
            return (
              <div
                key={pack.id}
                className="relative overflow-hidden rounded-2xl border border-muted/50 bg-muted/40 px-4 py-3"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${packAccent[pack.id] ?? ''}`} aria-hidden />
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text">{pack.name}</p>
                    <p className="text-xs text-text-muted">
                      {formatTokens(pack.amount)} · {formatFiatFromEur(pack.price, session.preferredCurrency)}
                    </p>
                    <p className="text-[0.7rem] text-text-muted/80">{effectiveLabel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {highlight ? (
                      <Badge variant="outline" className="rounded-full border-accent/40 bg-accent/10 text-[0.65rem] text-accent">
                        {highlight}
                      </Badge>
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(pack.id)}
                      disabled={purchaseMutation.isPending && pendingPack === pack.id}
                      aria-label={`Comprar ${pack.name} por ${formatFiatFromEur(pack.price, session.preferredCurrency)}`}
                    >
                      Comprar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="space-y-3 rounded-2xl border border-dashed border-muted/50 bg-muted/20 p-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Límite diario</span>
            <Badge variant="outline" className="text-xs">
              {formatTokens(limitUsage.today)} / {formatTokens(session.spendingLimits.daily)}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Límite mensual</span>
            <Badge variant="outline" className="text-xs">
              {formatTokens(limitUsage.month)} / {formatTokens(session.spendingLimits.monthly)}
            </Badge>
          </div>
          <div className="grid gap-2 text-xs text-text-muted">
            <label className="flex flex-col gap-1">
              <span>Límite diario (Créditos TKN)</span>
              <Input
                type="number"
                min={500}
                step={100}
                value={limitsDraft.daily}
                onChange={(event) => setLimitsDraft((prev) => ({ ...prev, daily: Number(event.target.value) }))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>Límite mensual (Créditos TKN)</span>
              <Input
                type="number"
                min={2000}
                step={100}
                value={limitsDraft.monthly}
                onChange={(event) => setLimitsDraft((prev) => ({ ...prev, monthly: Number(event.target.value) }))}
              />
            </label>
            <Button size="sm" onClick={handleLimitSave}>
              Guardar límites
            </Button>
          </div>
          <p className="rounded-2xl bg-muted/30 p-3 text-xs text-text-muted">
            {limitUsage.dailyRemaining > 0
              ? `Te quedan ${formatTokens(limitUsage.dailyRemaining)} hoy y ${formatTokens(limitUsage.monthlyRemaining)} este mes.`
              : 'Has alcanzado tu tope diario. Podrás volver a comprar mañana o al ajustar el límite.'}
          </p>
        </div>
        <div className="space-y-2 rounded-2xl border border-muted/50 bg-muted/20 p-4 text-xs text-text-muted">
          <h4 className="text-sm font-semibold text-text">Promociones activas</h4>
          <p className="rounded-xl bg-accent/10 p-3 text-accent">
            {welcomeGift.name}: primer regalo gratis para cuentas nuevas.
          </p>
          <ul className="space-y-2">
            {renewalPromotions.map((promo) => (
              <li key={promo.id} className="rounded-xl bg-muted/30 p-3">
                <span className="text-text">{promo.label}</span>
              </li>
            ))}
          </ul>
          {couponPrograms.length ? (
            <div className="rounded-2xl border border-muted/40 bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Programas corporativos</p>
              <ul className="mt-2 space-y-2">
                {couponPrograms.map((coupon) => (
                  <li key={coupon.id} className="rounded-xl bg-surface/80 p-3 text-xs text-text-muted">
                    <p className="text-sm font-semibold text-text">{coupon.name}</p>
                    <p>{coupon.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="space-y-4 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-xs text-text">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Programa de referidos</p>
              <p className="text-text-muted">
                {session.stats.referrals > 0
                  ? `🔥 Invitó a ${session.stats.referrals} amigos`
                  : 'Comparte tu link y gana +500 Créditos (TKN) cuando tus referidos compren.'}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatNumberCompact(session.stats.referrals)} referidos
            </Badge>
          </div>
          <ShareMenu
            title={`Únete a TKN con @${session.username}`}
            description="Videochats privados, foro y regalos tokenizados en modo seguro."
            url={session.referralLink}
            buttonLabel="Compartir link"
          />
          <Button size="sm" variant="secondary" onClick={handleReferralConversion}>
            Registrar compra referida
          </Button>
        </div>
        <div className="space-y-3 rounded-2xl border border-muted/50 bg-muted/20 p-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Insignias</span>
            <span>{session.stats.badges.length || '0'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.stats.badges.length === 0 ? (
              <p className="text-xs text-text-muted">Consigue badges publicando y recibiendo regalos.</p>
            ) : (
              session.stats.badges.map((badge) => (
                <Badge key={badge} variant="outline" className="rounded-full px-3 py-1 capitalize">
                  {badge.replace('-', ' ')}
                </Badge>
              ))
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={handleProfileBonus}>
            Reclamar bonus por completar perfil
          </Button>
        </div>
        {session.scope === 'guest' ? (
          <p className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-xs text-accent">
            Si borras cookies, podrías perder saldo. Crea cuenta para guardarlo.
          </p>
        ) : null}
        <GuestPurchaseGuard
          open={showGuard}
          onClose={() => setShowGuard(false)}
          onContinue={confirmGuestPurchase}
          onUpgrade={redirectToUpgrade}
        />
      </aside>
    </div>
  );

}
