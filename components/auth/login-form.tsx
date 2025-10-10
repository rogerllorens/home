'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginSchema } from '@/lib/validators';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useFeatureFlag } from '@/components/feature-flag-provider';
import { toast } from 'sonner';
import { login } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const schema = loginSchema;

export function LoginForm() {
  const t = useTranslations('forms');
  const ssoEnabled = useFeatureFlag('FEATURE_SSO');
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { usernameOrEmail: '', password: '', totp: '' }
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession({
        scope: data.scope,
        sessionId: data.sessionId,
        username: data.username,
        ageConfirmed: data.ageConfirmed
      });
      toast.success('Sesión iniciada', {
        description: `Bienvenido ${data.username ?? ''}`.trim()
      });
      queryClient.invalidateQueries();
      router.push('/');
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : 'No se pudo iniciar sesión. Inténtalo de nuevo.';
      toast.error('Error al iniciar sesión', { description: message });
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card className="space-y-6 p-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-heading font-semibold text-text">{t('login')}</h1>
          <p className="text-sm text-text-muted">SSO opcional Google/Apple, siempre disponible login por email.</p>
        </header>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted" htmlFor="login-username">
              {t('username')} / Email
            </label>
            <Input
              id="login-username"
              placeholder={t('username')}
              autoComplete="username"
              {...register('usernameOrEmail')}
            />
            {errors.usernameOrEmail ? (
              <p className="text-xs text-warn">{errors.usernameOrEmail.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted" htmlFor="login-password">
              {t('password')}
            </label>
            <Input
              id="login-password"
              type="password"
              placeholder={t('password')}
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password ? <p className="text-xs text-warn">{errors.password.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted" htmlFor="login-totp">
              Código TOTP (admins)
            </label>
            <Input
              id="login-totp"
              inputMode="numeric"
              placeholder="Código TOTP (admins)"
              maxLength={6}
              autoComplete="one-time-code"
              {...register('totp')}
            />
            <p className="text-xs text-text-muted">
              Requerido para cuentas admin y recomendable para moderadores. Si accedes desde una red no
              permitida, contacta con soporte.
            </p>
            {errors.totp ? <p className="text-xs text-warn">{errors.totp.message}</p> : null}
          </div>
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {t('login')}
          </Button>
        </form>
        {ssoEnabled ? (
          <div className="flex flex-col gap-2 text-sm text-text-muted">
            <Button variant="outline">Continuar con Google</Button>
            <Button variant="outline">Continuar con Apple</Button>
          </div>
        ) : null}
        <p className="text-xs text-text-muted">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" className="text-accent hover:text-accent-2">
            {t('register')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
