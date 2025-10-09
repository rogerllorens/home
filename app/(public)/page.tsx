import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { QuickStartChecklist } from '@/components/onboarding/quick-start-checklist';
import { fetchFeaturedProfiles, fetchForumCategories, staticCatalog } from '@/lib/api';
import { CREDIT_RATE_NOTE, formatNumberCompact, formatTokens } from '@/lib/utils';

export default async function HomePage() {
  const [tHome, tCta, tWallet] = await Promise.all([
    getTranslations('home'),
    getTranslations('cta'),
    getTranslations('wallet')
  ]);
  const profiles = await fetchFeaturedProfiles();
  const categories = await fetchForumCategories();
  const tags = Array.from(new Set(profiles.flatMap((profile) => profile.tags))).slice(0, 8);
  const { tokenPacks } = staticCatalog;
  const topGifted = profiles
    .slice()
    .sort((a, b) => (b.giftsToday ?? 0) - (a.giftsToday ?? 0));
  const newestProfiles = profiles.slice().reverse();
  const forumLeaders = profiles
    .slice()
    .sort((a, b) => (b.ppvUnlocks ?? 0) - (a.ppvUnlocks ?? 0));

  return (
    <div className="flex flex-col gap-12">
      <section className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
            +18
          </span>
          <h1 className="text-4xl font-heading font-bold md:text-5xl">{tHome('heroTitle')}</h1>
          <p className="max-w-xl text-lg text-text-muted">{tHome('heroSubtitle')}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link href="/match">{tCta('enter')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/wallet">{tWallet('packs')}</Link>
            </Button>
          </div>
        </div>
        <Card className="bg-gradient-to-br from-surface/60 to-muted/40">
          <CardHeader>
            <CardTitle>{tHome('featuredProfiles')}</CardTitle>
            <CardDescription>{tHome('matchCta')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {profiles.map((profile) => (
              <div key={profile.username} className="flex flex-col items-center rounded-2xl border border-muted/40 bg-muted/30 p-4">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  width={80}
                  height={80}
                  className="rounded-full border border-muted/60 object-cover"
                />
                <p className="mt-3 text-sm font-semibold">{profile.displayName}</p>
                <p className="text-xs text-text-muted">@{profile.username}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {profile.tags.slice(0, 3).map((tag) => (
                    <Chip key={tag} selected className="px-3 py-1 text-xs">
                      #{tag}
                    </Chip>
                  ))}
                </div>
                <span className="token-pill mt-4">{formatTokens(profile.passPrice)}</span>
                <Button asChild size="sm" variant="outline" className="mt-4 w-full">
                  <Link href={`/u/${profile.username}`}>{tCta('viewProfile')}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <QuickStartChecklist />
        <Card className="h-full border-accent/30 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Recarga en segundos</CardTitle>
            <CardDescription className="text-text-muted">
              {CREDIT_RATE_NOTE}. Escoge el pack más popular o programa tus límites diarios y mensuales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-muted">
            {tokenPacks.map((pack, index) => (
              <div
                key={pack.id}
                className="flex items-center justify-between rounded-2xl bg-surface/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-text">
                    {pack.name}
                    {index === 1 ? (
                      <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-[0.65rem] font-semibold text-accent">
                        Más popular
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-text-muted">{formatTokens(pack.amount)}</p>
                </div>
                <span className="text-xs text-text-muted">{pack.price.toFixed(2)} €</span>
              </div>
            ))}
            <Button asChild className="w-full" size="lg">
              <Link href="/wallet">Recargar créditos</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold">Descubre categorías y tendencias</h2>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Chip key={tag} selected={false} className="bg-muted/60">
              #{tag}
            </Chip>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading font-semibold">Perfiles nuevos</h3>
            <Link href="/" className="text-sm text-accent hover:text-accent-2">
              Ver más
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {newestProfiles.map((profile) => (
              <Card
                key={`new-${profile.username}`}
                className="min-w-[220px] rounded-3xl border-muted/50 bg-surface/80"
              >
                <CardContent className="flex flex-col items-center gap-3 p-5">
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    width={72}
                    height={72}
                    className="rounded-full border border-muted/60 object-cover"
                  />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text">{profile.displayName}</p>
                    <p className="text-xs text-text-muted">@{profile.username}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 text-[0.65rem] text-text-muted">
                    {profile.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-muted/40 px-2 py-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <Button asChild size="sm" variant="secondary" className="w-full">
                    <Link href={`/u/${profile.username}`}>Ver perfil</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading font-semibold">Más regalados hoy</h3>
            <Link href="/match" className="text-sm text-accent hover:text-accent-2">
              Envía un gift
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {topGifted.map((profile) => (
              <Card
                key={`gifted-${profile.username}`}
                className="min-w-[220px] rounded-3xl border border-accent/30 bg-accent/5"
              >
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text">@{profile.username}</p>
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[0.65rem] font-semibold text-accent">
                      +{formatNumberCompact(profile.giftsToday ?? 0)} gifts
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {formatNumberCompact(profile.ppvUnlocks ?? 0)} PPV desbloqueados · {formatTokens(profile.passPrice)} pase 30d
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/u/${profile.username}`}>Apoyar ahora</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading font-semibold">Más activos en foro</h3>
            <Link href="/forum" className="text-sm text-accent hover:text-accent-2">
              Abrir foro
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {forumLeaders.map((profile) => (
              <Card
                key={`forum-${profile.username}`}
                className="min-w-[220px] rounded-3xl border border-accent-2/30 bg-accent-2/5"
              >
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text">@{profile.username}</p>
                    <span className="rounded-full bg-accent-2/20 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-2">
                      +{formatNumberCompact(profile.referralCount ?? 0)} aportes
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Comparte hilos, responde dudas y gana badges visibles en tu perfil.
                  </p>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/forum`}>Ver hilos</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-muted/60 bg-muted/30 p-6">
        <h2 className="text-xl font-heading font-semibold">Más regalados hoy</h2>
        <p className="mt-1 text-sm text-text-muted">
          Gifts, PPV y pases tokenizados que más ingresos generaron en las últimas 24 horas.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {topGifted.slice(0, 3).map((profile, index) => (
            <Card key={profile.username} className="border-accent/20 bg-surface/70">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-base">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                    #{index + 1}
                  </span>
                  @{profile.username}
                </CardTitle>
                <Chip selected type="button">
                  {profile.isOnline ? 'En línea' : 'Offline'}
                </Chip>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-text-muted">
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2">
                  <span>Gifts</span>
                  <span className="font-semibold text-text">{formatNumberCompact(profile.giftsToday ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2">
                  <span>PPV desbloqueados</span>
                  <span className="font-semibold text-text">{formatNumberCompact(profile.ppvUnlocks ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2">
                  <span>Referidos</span>
                  <span className="font-semibold text-text">{formatNumberCompact(profile.referralCount ?? 0)}</span>
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/u/${profile.username}`}>Ver perfil</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Match 1:1</CardTitle>
            <CardDescription>{tHome('matchCta')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-muted">
            <p>Consentimientos persistentes con chips editables.</p>
            <p>Animaciones de regalos ≤2 s con respeto a prefers-reduced-motion.</p>
            <p>Reportes, blur y siguiente instantáneo.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Foro y comunidad</CardTitle>
            <CardDescription>{tHome('exploreCategories')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-muted">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-xs text-text-muted">{category.description}</p>
                </div>
                <span className="text-xs text-text-muted">{category.threads} hilos</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Wallet de créditos</CardTitle>
            <CardDescription>{CREDIT_RATE_NOTE}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-muted">
            {tokenPacks.map((pack) => (
              <div key={pack.id} className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                <div>
                  <p className="font-semibold">{pack.name}</p>
                  <p className="text-xs text-text-muted">{formatTokens(pack.amount)}</p>
                </div>
                <span className="text-xs text-text-muted">{pack.price.toFixed(2)} €</span>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link href="/wallet">{tWallet('packs')}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl border border-muted/60 bg-muted/30 p-8 text-center">
        <h3 className="text-2xl font-heading font-semibold">¿Listo para entrar al match?</h3>
        <p className="mt-2 text-text-muted">Preferencias guardadas, modo invitado y créditos listos para regalar.</p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/match">{tCta('goToMatch')}</Link>
        </Button>
      </section>
    </div>
  );
}
