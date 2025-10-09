'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatFiat, formatTokens, CREDIT_RATE_NOTE } from '@/lib/utils';

const COMMISSION_ROWS = [
  {
    id: 'gift',
    label: 'Regalos, PPV, tickets VIP y pago por minuto',
    creatorShare: 0.7,
    platformShare: 0.3
  },
  {
    id: 'pass',
    label: 'Pase 30 días del perfil',
    creatorShare: 0.8,
    platformShare: 0.2
  }
] as const;

type CommissionKey = (typeof COMMISSION_ROWS)[number]['id'];

export function FinancialPolicy() {
  const [selected, setSelected] = useState<CommissionKey>('gift');
  const [tokens, setTokens] = useState(5000);

  const metrics = useMemo(() => {
    const row = COMMISSION_ROWS.find((item) => item.id === selected) ?? COMMISSION_ROWS[0];
    const safeTokens = Math.max(tokens, 0);
    const creatorTokens = safeTokens * row.creatorShare;
    const platformTokens = safeTokens * row.platformShare;
    return {
      creatorTokens,
      platformTokens,
      approxEur: creatorTokens / 100,
      label: row.label,
      creatorShare: row.creatorShare,
      platformShare: row.platformShare
    };
  }, [selected, tokens]);

  return (
    <section className="mt-8 space-y-6 rounded-3xl border border-muted/60 bg-muted/20 p-6">
      <header className="space-y-2">
        <h2 className="text-xl font-heading font-semibold text-text">Política financiera de Créditos (TKN)</h2>
        <p className="text-sm text-text-muted">
          {CREDIT_RATE_NOTE}. Los Créditos (TKN) no son un instrumento financiero y no son reembolsables salvo las
          obligaciones legales vigentes. Las creadoras y creadores pueden retirar sus ganancias tras el periodo de hold
          antifraude.
        </p>
      </header>
      <div className="overflow-hidden rounded-2xl border border-muted/40">
        <table className="w-full text-left text-sm text-text-muted">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-text">
            <tr>
              <th className="px-4 py-3">Funcionalidad</th>
              <th className="px-4 py-3">Reparte creador</th>
              <th className="px-4 py-3">Reparte plataforma</th>
            </tr>
          </thead>
          <tbody>
            {COMMISSION_ROWS.map((row) => (
              <tr key={row.id} className="border-t border-muted/40">
                <td className="px-4 py-3 text-text">{row.label}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="rounded-full border-success/30 bg-success/10 text-success">
                    {(row.creatorShare * 100).toFixed(0)}%
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="rounded-full border-accent/30 bg-accent/10 text-accent">
                    {(row.platformShare * 100).toFixed(0)}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-4 rounded-2xl border border-muted/40 bg-muted/30 p-5">
        <h3 className="text-lg font-semibold text-text">Estimador de retiro</h3>
        <p className="text-sm text-text-muted">
          Calcula cuántos Créditos (TKN) llegarán a tu wallet disponible tras el hold antifraude de 7 días. Los valores
          son orientativos y se liquidan en tokens antes de que solicites un payout.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-text-muted">
            <span>Monto en Créditos (TKN)</span>
            <Input
              type="number"
              min={0}
              step={100}
              value={tokens}
              onChange={(event) => setTokens(Number(event.target.value))}
              className="rounded-xl bg-surface/80"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-text-muted">
            <span>Tipo de operación</span>
            <Select
              value={selected}
              onChange={(event) => setSelected(event.target.value as CommissionKey)}
              className="rounded-xl bg-surface/80"
            >
              {COMMISSION_ROWS.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex flex-col justify-center gap-1 rounded-2xl border border-dashed border-muted/40 bg-surface/60 p-4 text-sm text-text">
            <span className="font-semibold">Retiro estimado</span>
            <span className="text-lg font-heading font-bold">
              {formatTokens(Math.round(metrics.creatorTokens))}
            </span>
            <span className="text-xs text-text-muted">≈ {formatFiat(Math.round(metrics.creatorTokens))}</span>
          </div>
        </div>
        <div className="grid gap-3 text-xs text-text-muted md:grid-cols-3">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="font-semibold text-text">Créditos para la plataforma</p>
            <p>{formatTokens(Math.round(metrics.platformTokens))}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="font-semibold text-text">Hold antifraude</p>
            <p>7 días desde la transacción antes de pasar a disponible.</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="font-semibold text-text">Equivalencia aproximada</p>
            <p>{metrics.approxEur.toFixed(2)} € (antes de tasas de payout).</p>
          </div>
        </div>
      </div>
    </section>
  );
}
