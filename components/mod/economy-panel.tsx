'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { fetchAdminEconomy, queryKeys } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminGiftSchema, adminTokenPackSchema } from '@/lib/validators';
import { formatTokens } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

export function EconomyPanel() {
  const t = useTranslations('admin.economy');
  const { data, isLoading } = useQuery(queryKeys.adminEconomy, fetchAdminEconomy);
  const [packId, setPackId] = useState<string>();
  const [giftId, setGiftId] = useState<string>();

  const packs = data?.packs ?? [];
  const gifts = data?.gifts ?? [];

  const selectedPack = useMemo(() => packs.find((pack) => pack.id === packId) ?? packs[0], [packId, packs]);
  const selectedGift = useMemo(() => gifts.find((gift) => gift.id === giftId) ?? gifts[0], [giftId, gifts]);

  const packForm = useForm({
    resolver: zodResolver(adminTokenPackSchema),
    defaultValues: selectedPack ?? { id: '', name: '', amount: 0, price: 0 }
  });

  const giftForm = useForm({
    resolver: zodResolver(adminGiftSchema),
    defaultValues: selectedGift ?? { id: '', name: '', tokens: 0, animKey: '', isActive: true }
  });

  useEffect(() => {
    if (selectedPack) {
      packForm.reset(selectedPack);
    }
  }, [selectedPack, packForm]);

  useEffect(() => {
    if (selectedGift) {
      giftForm.reset(selectedGift);
    }
  }, [selectedGift, giftForm]);

  const onSubmitPack = packForm.handleSubmit((values) => {
    toast.success(t('toast.pack', { name: values.name }));
  });

  const onSubmitGift = giftForm.handleSubmit((values) => {
    toast.success(t('toast.gift', { name: values.name }));
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card className="rounded-3xl bg-surface/60">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{t('packs.title')}</CardTitle>
              <CardDescription>{t('packs.subtitle')}</CardDescription>
            </div>
            <Select value={selectedPack?.id ?? ''} onChange={(event) => setPackId(event.target.value)} className="lg:w-60">
              {packs.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name} · {formatTokens(pack.amount)}
                </option>
              ))}
            </Select>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmitPack} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('form.id')}
                </label>
                <Input {...packForm.register('id')} disabled className="cursor-not-allowed bg-muted/40" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('form.name')}
                </label>
                <Input {...packForm.register('name')} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('form.tokens')}
                </label>
                <Input type="number" min={100} step={100} {...packForm.register('amount', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('form.price')}
                </label>
                <Input type="number" step="0.01" min={0.5} {...packForm.register('price', { valueAsNumber: true })} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit">{t('form.save')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="rounded-3xl bg-surface/60">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{t('gifts.title')}</CardTitle>
              <CardDescription>{t('gifts.subtitle')}</CardDescription>
            </div>
            <Select value={selectedGift?.id ?? ''} onChange={(event) => setGiftId(event.target.value)} className="lg:w-60">
              {gifts.map((gift) => (
                <option key={gift.id} value={gift.id}>
                  {gift.name} · {formatTokens(gift.tokens)}
                </option>
              ))}
            </Select>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmitGift} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('form.id')}
                </label>
                <Input {...giftForm.register('id')} disabled className="cursor-not-allowed bg-muted/40" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('form.name')}
                </label>
                <Input {...giftForm.register('name')} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('form.tokens')}
                </label>
                <Input type="number" min={1} step={1} {...giftForm.register('tokens', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('form.anim')}
                </label>
                <Input {...giftForm.register('animKey')} />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-text-muted">
                  <input type="checkbox" {...giftForm.register('isActive')} className="h-4 w-4 rounded border-muted/60" />
                  {t('form.active')}
                </label>
                <Button type="submit">{t('form.save')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-3xl bg-surface/60">
        <CardHeader>
          <CardTitle>{t('ranges.title')}</CardTitle>
          <CardDescription>{t('ranges.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-text-muted">
          <RangeItem label={t('ranges.ppv')} range={data.ranges.ppv} />
          <RangeItem label={t('ranges.pass')} range={data.ranges.pass} />
          <RangeItem label={t('ranges.minute')} range={data.ranges.payPerMinute} />
          <RangeItem label={t('ranges.vip')} range={data.ranges.vipTicket} />
          <div className="rounded-2xl border border-dashed border-accent/40 px-4 py-3 text-xs text-accent">
            Tarifa mínima recomendada por minuto: {formatTokens(data.minimumPayPerMinute)}
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Promociones activas</h4>
            <ul className="space-y-2">
              {data.promotions.map((promo) => (
                <li key={promo.id} className="rounded-2xl border border-muted/40 bg-muted/20 px-3 py-2 text-xs">
                  {promo.description}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RangeItem({ label, range }: { label: string; range: { min: number; max: number } }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-dashed border-muted/40 px-4 py-3">
      <span className="font-semibold">{label}</span>
      <Badge variant="outline" className="text-xs">
        {range.min} – {range.max} Créditos (TKN)
      </Badge>
    </div>
  );
}
