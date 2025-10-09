'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { COUNTRY_OPTIONS, resolveDefaultCountry, resolveLanguagesForCountry } from '@/lib/utils';
import { useSession } from '@/components/session-provider';

interface Props {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  onUpgrade: () => void;
}

const EMAIL_STORAGE_KEY = 'tkn:guest-checkout-email';

export function GuestPurchaseGuard({ open, onClose, onContinue, onUpgrade }: Props) {
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState(resolveDefaultCountry());
  const session = useSession();

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (stored) {
      setEmail(stored);
    }
    const storedCountry = window.localStorage.getItem('tkn:guest-country');
    if (storedCountry) {
      setCountry(storedCountry);
    }
  }, [open]);

  const persistEmail = () => {
    if (typeof window === 'undefined') return;
    if (email.trim().length === 0) {
      window.localStorage.removeItem(EMAIL_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email.trim());
    window.localStorage.setItem('tkn:guest-country', country);
  };

  const handleContinue = () => {
    persistEmail();
    session.setCountryCode(country);
    session.setLanguageTags(resolveLanguagesForCountry(country));
    onContinue();
  };

  const handleUpgrade = () => {
    persistEmail();
    session.setCountryCode(country);
    session.setLanguageTags(resolveLanguagesForCountry(country));
    onUpgrade();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
      <DialogContent className="max-w-lg rounded-3xl border border-muted/50 bg-surface">
        <DialogHeader>
          <DialogTitle>Compra de créditos como invitado</DialogTitle>
          <DialogDescription>
            Si compras créditos (TKN) como invitado dependerás de esta sesión. Si borras cookies o cambias de
            dispositivo podrías perder el saldo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-text-muted">
          <p className="rounded-2xl bg-muted/30 p-4">
            <strong className="text-text">Opción A · rápida:</strong> continúa como invitado y finaliza el checkout en
            segundos. Si el proveedor de pago solicita un correo podremos enviarte un enlace corporativo de
            recuperación para reclamar tus créditos en caso de incidencia.
          </p>
          <p className="rounded-2xl bg-muted/30 p-4">
            <strong className="text-text">Opción B · segura:</strong> crea una cuenta antes de pagar. Guardaremos tu saldo de
            créditos, favoritos, seguimientos y límites de gasto automáticamente.
          </p>
          <div className="rounded-2xl border border-dashed border-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              ¿Quieres recibir un enlace de recuperación?
            </p>
            <p className="mt-1 text-xs text-text-muted/80">
              Introduce un correo corporativo opcional. Lo usaremos solo si necesitas reclamar tu saldo de créditos como
              invitado.
            </p>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-3"
            />
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Prioriza matches de tu país
              </p>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger aria-label="Selecciona tu país">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.7rem] text-text-muted">
                Usamos tu país para conectarte con personas del mismo idioma cuando sea posible.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={handleContinue}>
            Comprar como invitado
          </Button>
          <Button className="flex-1" onClick={handleUpgrade}>
            Crear cuenta y guardar mi saldo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
