'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upgradeSchema } from '@/lib/validators';
import { useSession } from '@/components/session-provider';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CaptchaPlaceholder } from '@/components/ui/captcha-placeholder';
import { upgradeGuest } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { COUNTRY_OPTIONS, INTEREST_TAGS, resolveDefaultCountry } from '@/lib/utils';
import { Chip } from '@/components/ui/chip';
import { useEffect, useState } from 'react';

const schema = upgradeSchema;

type FormValues = z.infer<typeof schema>;

export function GuestUpgradeForm() {
  const session = useSession();
  const { sessionId, setSession } = useAuthStore((state) => ({
    sessionId: state.sessionId,
    setSession: state.setSession
  }));
  const queryClient = useQueryClient();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    session.languageTags.length > 0 ? session.languageTags : session.preferences ?? []
  );
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sessionId: sessionId ?? '',
      username: '',
      email: '',
      password: '',
      countryCode: resolveDefaultCountry(),
      languageTags: session.languageTags.length > 0 ? session.languageTags : session.preferences ?? []
    }
  });

  const countryCode = watch('countryCode');

  useEffect(() => {
    register('languageTags');
  }, [register]);

  useEffect(() => {
    setValue('languageTags', selectedInterests, { shouldValidate: false });
  }, [selectedInterests, setValue]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest]
    );
  };

  const upgradeMutation = useMutation({
    mutationFn: upgradeGuest,
    onSuccess: (data) => {
      setSession({
        scope: data.scope,
        sessionId: data.sessionId,
        username: data.username,
        ageConfirmed: data.ageConfirmed
      });
      toast.success('Saldo migrado', {
        description: `Guardamos ${session.formatBalance()}`
      });
      queryClient.invalidateQueries();
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : 'No se pudo migrar el saldo. Intenta nuevamente.';
      toast.error('Error al migrar saldo', { description: message });
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    session.setCountryCode(values.countryCode);
    session.setLanguageTags(values.languageTags ?? []);
    await upgradeMutation.mutateAsync(values);
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card className="space-y-6 p-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-heading font-semibold text-text">Migrar saldo invitado</h1>
          <p className="text-sm text-text-muted">
            Tienes {session.formatBalance()}. Al crear cuenta, conservas créditos (TKN) y regalos.
          </p>
        </header>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input type="hidden" {...register('sessionId')} />
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted" htmlFor="upgrade-username">
              Username
            </label>
            <Input
              id="upgrade-username"
              placeholder="Username"
              autoComplete="username"
              {...register('username')}
            />
            {errors.username ? <p className="text-xs text-warn">{errors.username.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted" htmlFor="upgrade-email">
              Email
            </label>
            <Input
              id="upgrade-email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email ? <p className="text-xs text-warn">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted" htmlFor="upgrade-password">
              Password
            </label>
            <Input
              id="upgrade-password"
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password ? <p className="text-xs text-warn">{errors.password.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Select
              value={countryCode}
              onValueChange={(value) => setValue('countryCode', value, { shouldValidate: true })}
            >
              <SelectTrigger aria-label="Selecciona tu país">
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.countryCode ? <p className="text-xs text-warn">{errors.countryCode.message}</p> : null}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Ajusta tus intereses para el matching
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_TAGS.map((interest) => (
                <Chip
                  key={interest}
                  selected={selectedInterests.includes(interest)}
                  onClick={() => toggleInterest(interest)}
                >
                  #{interest}
                </Chip>
              ))}
            </div>
          </div>
          <CaptchaPlaceholder />
          <Button type="submit" className="w-full" disabled={upgradeMutation.isPending}>
            Migrar ahora
          </Button>
        </form>
      </Card>
    </div>
  );
}
