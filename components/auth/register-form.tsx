'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerSchema } from '@/lib/validators';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';
import { CaptchaPlaceholder } from '@/components/ui/captcha-placeholder';
import { registerAccount } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { useRouter } from 'next/navigation';
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
import { useSession } from '@/components/session-provider';

const schema = registerSchema;

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const t = useTranslations('forms');
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const session = useSession();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      ageConfirmed: false,
      countryCode: resolveDefaultCountry(),
      languageTags: []
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

  const registerMutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: (data) => {
      setSession({
        scope: data.scope,
        sessionId: data.sessionId,
        username: data.username,
        ageConfirmed: data.ageConfirmed
      });
      toast.success('Cuenta creada', { description: `@${data.username ?? ''}`.trim() });
      queryClient.invalidateQueries();
      router.push('/');
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : 'No se pudo crear la cuenta. Inténtalo nuevamente.';
      toast.error('Error al registrar', { description: message });
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    session.setCountryCode(values.countryCode);
    session.setLanguageTags(values.languageTags ?? []);
    await registerMutation.mutateAsync(values);
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card className="space-y-6 p-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-heading font-semibold text-text">{t('register')}</h1>
          <p className="text-sm text-text-muted">Accede a PPV, pases y salas VIP como creador.</p>
        </header>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Input placeholder={t('username')} {...register('username')} />
            {errors.username ? <p className="text-xs text-warn">{errors.username.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Input type="email" placeholder={t('email')} {...register('email')} />
            {errors.email ? <p className="text-xs text-warn">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Input type="password" placeholder={t('password')} {...register('password')} />
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
              Elige intereses para matches afinados
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
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input type="checkbox" {...register('ageConfirmed')} />
            {t('ageConfirm')}
          </label>
          {errors.ageConfirmed ? <p className="text-xs text-warn">{errors.ageConfirmed.message}</p> : null}
          <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
            {t('register')}
          </Button>
        </form>
        <p className="text-xs text-text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-accent hover:text-accent-2">
            {t('login')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
