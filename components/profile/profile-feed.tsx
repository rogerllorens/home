"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  type ProfileSummary,
  formatTokens,
  euroEquivalent,
  formatNumberCompact,
  BADGE_CATALOG,
  copyToClipboard,
  resolveCreatorTier,
  formatFiatFromEur
} from '@/lib/utils';
import { useSession } from '@/components/session-provider';
import { Badge } from '@/components/ui/badge';
import {
  Bookmark,
  BookmarkCheck,
  ShieldBan,
  UserPlus2,
  UserCheck2,
  Lock,
  CheckCircle2,
  Sparkles,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { ShareMenu } from '@/components/shared/share-menu';
import { buyProfilePass, unlockMedia } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const demoProfile: ProfileSummary = {
  username: 'luna',
  bio: 'Educadora sexual y performer indie. Consent is my love language.',
  isOnline: true,
  avatar: 'https://placehold.co/96x96/121820/E5E7EB?text=L',
  preferences: ['soft', 'sfw', 'roles'],
  passPrice: 1499,
  hasPendingEarnings: 9100,
  media: [
    {
      id: 'm-1',
      type: 'image',
      title: 'Sesión neón',
      sizeMb: 5,
      visibility: 'free',
      url: 'https://placehold.co/600x400/0B0F14/E5E7EB?text=Free+Media'
    },
    {
      id: 'm-2',
      type: 'video',
      title: 'Teaser exclusivo',
      sizeMb: 120,
      visibility: 'ppv',
      price: 999,
      url: 'https://placehold.co/600x400/121820/E5E7EB?text=PPV'
    },
    {
      id: 'm-3',
      type: 'image',
      title: 'Behind the scenes',
      sizeMb: 8,
      visibility: 'pass_only',
      url: 'https://placehold.co/600x400/1B2330/E5E7EB?text=Pase+30d'
    }
  ]
};

export const ProfileFeed: React.FC = () => {
  const session = useSession();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [showBundleUpsell, setShowBundleUpsell] = useState(false);
  const [pendingUnlock, setPendingUnlock] = useState<{ id: string; price: number } | null>(null);
  const isFollowing = session.isFollowingUser(demoProfile.username);
  const isBlocked = session.isBlocked(demoProfile.username);
  const welcomeGiftAvailable = useMemo(() => session.scope === 'user', [session.scope]);
  const badgeMap = useMemo(() => new Map(BADGE_CATALOG.map((badge) => [badge.id, badge.label])), []);
  const embedCode = useMemo(() => {
    const url = `${session.referralLink}&profile=${demoProfile.username}`;
    return `<iframe src="${url}&embed=true" title="Perfil @${demoProfile.username}" width="320" height="420" style="border-radius:24px;border:none;overflow:hidden;background:#0B0F14;color:#E5E7EB"></iframe>`;
  }, [session.referralLink]);
  const lockedMedia = demoProfile.media.filter((media) => media.visibility !== 'free');
  const bundleItems = lockedMedia.slice(0, 3);
  const bundlePrice = bundleItems.reduce((acc, item) => acc + (item.price ?? 0), 0);
  const creatorTier = resolveCreatorTier(
    demoProfile.hasPendingEarnings + session.pendingEarnings + session.availableEarnings
  );
  const passSavings = bundlePrice > 0 ? bundlePrice - demoProfile.passPrice : 0;

  const executeUnlock = async (mediaId: string, price: number) => {
    const ok = await session.spend(price, `PPV ${mediaId}`, {
      execute: () => unlockMedia(mediaId)
    });
    if (!ok) return;
    toast.success('Contenido desbloqueado');
    setUnlockedIds((prev) => [...prev, mediaId]);
    session.addNotification({
      type: 'ppv',
      message: `Has desbloqueado ${mediaId} de @${demoProfile.username}.`
    });
  };

  const handleUnlock = async (mediaId: string, price: number) => {
    const lockedRemaining = lockedMedia.filter((media) => !unlockedIds.includes(media.id));
    if (lockedRemaining.length > 1 && bundleItems.length > 1 && !showBundleUpsell) {
      setPendingUnlock({ id: mediaId, price });
      setShowBundleUpsell(true);
      return;
    }
    await executeUnlock(mediaId, price);
  };

  const handlePass = async () => {
    const ok = await session.spend(demoProfile.passPrice, 'Pase 30 días', {
      execute: () => buyProfilePass(demoProfile.username, demoProfile.passPrice)
    });
    if (!ok) return;
    toast.success('Pase activado');
    session.addNotification({
      type: 'pass',
      message: `Tu pase con @${demoProfile.username} estará activo 30 días.`
    });
  };

  const handleBundleUnlock = async () => {
    if (bundleItems.length === 0 || bundlePrice === 0) return;
    const ok = await session.spend(bundlePrice, 'Bundle PPV', {
      execute: () => Promise.all(bundleItems.map((item) => unlockMedia(item.id)))
    });
    if (!ok) return;
    toast.success(`Has desbloqueado ${bundleItems.length} contenidos premium`);
    setUnlockedIds((prev) => Array.from(new Set([...prev, ...bundleItems.map((item) => item.id)])));
    session.addNotification({
      type: 'ppv',
      message: `Bundle desbloqueado con ${bundleItems.length} piezas por ${formatTokens(bundlePrice)}.`
    });
    setShowBundleUpsell(false);
    setPendingUnlock(null);
  };

  const confirmSingleUnlock = async () => {
    if (pendingUnlock) {
      await executeUnlock(pendingUnlock.id, pendingUnlock.price);
    }
    setShowBundleUpsell(false);
    setPendingUnlock(null);
  };

  const toggleFollow = () => {
    session.toggleFollowUser(demoProfile.username);
    toast.success(isFollowing ? 'Has dejado de seguir' : 'Siguiendo perfil', {
      description: `@${demoProfile.username}`
    });
  };

  const toggleBlock = () => {
    if (isBlocked) {
      session.unblockUser(demoProfile.username);
      toast.success('Usuario desbloqueado');
    } else {
      session.blockUser(demoProfile.username);
      toast('Usuario bloqueado', {
        description: 'No volverás a emparejar ni recibir mensajes.'
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <section className="card p-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src={demoProfile.avatar}
              alt={demoProfile.username}
              width={72}
              height={72}
              className="rounded-full border border-muted/50"
            />
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold">@{demoProfile.username}</h1>
              <p className="text-sm text-text-muted">{demoProfile.bio}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                {demoProfile.preferences.map((pref) => (
                  <span key={pref} className="rounded-full bg-muted/40 px-3 py-1">
                    {pref}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text">
                <Badge variant="outline" className="flex items-center gap-1 rounded-full border-accent/40 bg-accent/10 text-accent">
                  <Award className="h-3.5 w-3.5" aria-hidden /> {creatorTier.label}
                </Badge>
                <span className="rounded-full bg-muted/40 px-3 py-1 text-text-muted">
                  {formatTokens(demoProfile.hasPendingEarnings)} pendientes
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" onClick={toggleFollow} aria-pressed={isFollowing}>
                {isFollowing ? (
                  <>
                    <UserCheck2 className="mr-2 h-4 w-4" aria-hidden /> Siguiendo
                  </>
                ) : (
                  <>
                    <UserPlus2 className="mr-2 h-4 w-4" aria-hidden /> Seguir
                  </>
                )}
              </Button>
              <Button size="sm" onClick={handleBundleUnlock}>
                <Sparkles className="mr-2 h-4 w-4" aria-hidden /> Desbloquear todo
              </Button>
            </div>
            <ShareMenu
              title={`Descubre a @${demoProfile.username} en TKN`}
              description="Posts PPV, pase 30 días y regalos pagados con Créditos (TKN) en videochat privado."
              url={`${session.referralLink}&profile=${demoProfile.username}`}
              buttonLabel="Compartir perfil"
            />
          </div>
        </header>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <Badge variant="outline" className="border-accent/40 text-accent">
            {isFollowing ? 'Siguiendo' : 'Explora sus PPV'}
          </Badge>
          <Badge variant="secondary" className="bg-success/15 text-success">
            Pase {formatTokens(demoProfile.passPrice)} · {euroEquivalent(demoProfile.passPrice)}
          </Badge>
          {welcomeGiftAvailable ? <Badge variant="secondary">Heart de bienvenida disponible</Badge> : null}
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl border border-muted/40 bg-muted/20 p-4 text-xs text-text">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col rounded-xl bg-surface/70 px-3 py-2">
              <span className="text-text-muted">Posts</span>
              <span className="text-lg font-semibold">{formatNumberCompact(session.stats.posts)}</span>
            </div>
            <div className="flex flex-col rounded-xl bg-surface/70 px-3 py-2">
              <span className="text-text-muted">Likes recibidos</span>
              <span className="text-lg font-semibold">{formatNumberCompact(session.stats.likes)}</span>
            </div>
            <div className="flex flex-col rounded-xl bg-surface/70 px-3 py-2">
              <span className="text-text-muted">Gifts</span>
              <span className="text-lg font-semibold">{formatNumberCompact(session.stats.gifts)}</span>
            </div>
            <div className="flex flex-col rounded-xl bg-surface/70 px-3 py-2">
              <span className="text-text-muted">Referidos</span>
              <span className="text-lg font-semibold">{session.stats.referrals}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {session.stats.badges.length === 0 ? (
              <span className="text-text-muted">Consigue insignias publicando y generando ingresos.</span>
            ) : (
              session.stats.badges.map((badgeId) => (
                <Badge key={badgeId} variant="outline" className="rounded-full px-3 py-1">
                  {badgeMap.get(badgeId) ?? badgeId}
                </Badge>
              ))
            )}
          </div>
        </div>
        {bundleItems.length > 0 && bundlePrice > 0 ? (
          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-accent/30 bg-accent/10 p-6 text-sm text-text">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden />
                Desbloquear todo por {formatTokens(bundlePrice)}
              </p>
              <span className="text-xs text-text-muted">Incluye {bundleItems.length} PPV premium</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-text-muted">
              {bundleItems.map((item) => (
                <span key={item.id} className="rounded-full bg-surface/70 px-3 py-1">
                  {item.title ?? item.id}
                </span>
              ))}
            </div>
            <Button
              className="group relative overflow-hidden rounded-full bg-accent px-6 py-3 text-sm font-semibold shadow-xl"
              onClick={handleBundleUnlock}
            >
              <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-accent-2 transition-transform duration-500 group-hover:translate-x-0" aria-hidden />
              <span className="relative flex items-center gap-2">
                <Sparkles className="h-4 w-4" aria-hidden />
                Swipe para desbloquear todo
              </span>
            </Button>
          </div>
        ) : null}
        <div className="mt-6 grid gap-4" role="feed" aria-live="polite">
          {demoProfile.media.map((media) => {
            const unlocked = media.visibility === 'free' || unlockedIds.includes(media.id);
            const requiresPass = media.visibility === 'pass_only';
            const bookmarked = session.isPostBookmarked(media.id);
            const status = (() => {
              if (media.visibility === 'free') {
                return {
                  label: 'Gratis',
                  className: 'bg-success/10 text-success',
                  icon: <CheckCircle2 className="h-4 w-4" aria-hidden />
                };
              }
              if (media.visibility === 'ppv') {
                return {
                  label: `PPV · ${formatTokens(media.price ?? 0)}`,
                  className: 'bg-accent/15 text-accent',
                  icon: <Lock className="h-4 w-4" aria-hidden />
                };
              }
              return {
                label: 'Incluido con tu pase',
                className: 'bg-accent-2/15 text-accent-2',
                icon: <Sparkles className="h-4 w-4" aria-hidden />
              };
            })();
            return (
              <div key={media.id} className="overflow-hidden rounded-2xl border border-muted/40">
                <div className="relative aspect-video">
                  <Image
                    src={media.url}
                    alt={media.title ?? 'Media'}
                    fill
                    className="object-cover"
                    style={{ filter: unlocked ? 'none' : 'blur(12px)' }}
                  />
                  <div
                    className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {status.icon}
                    {status.label}
                  </div>
                  {!unlocked ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur">
                      <div className="flex flex-col items-center gap-3 text-sm text-text">
                        {media.visibility === 'ppv' ? (
                          <Button
                            size="sm"
                            className="group relative overflow-hidden rounded-full bg-accent px-6 py-2 text-sm font-semibold"
                            onClick={() => handleUnlock(media.id, media.price ?? 0)}
                          >
                            <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-accent-2 transition-transform duration-500 group-hover:translate-x-0" aria-hidden />
                            <span className="relative flex items-center gap-2">
                              <Lock className="h-4 w-4" aria-hidden />
                              Swipe para desbloquear ({formatTokens(media.price ?? 0)})
                            </span>
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={handlePass}>
                            Activar pase 30 días
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-3 bg-surface/70 p-4 text-sm text-text">
                  <div
                    className="flex items-center justify-between gap-3"
                    role="article"
                    aria-label={media.title ?? 'Contenido premium'}
                  >
                    <span className="font-semibold">{media.title ?? 'Contenido premium'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-3 py-1 text-xs"
                        onClick={() => session.toggleBookmark(media.id)}
                      >
                        {bookmarked ? (
                          <BookmarkCheck className="h-3.5 w-3.5 text-accent" aria-hidden />
                        ) : (
                          <Bookmark className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {bookmarked ? 'Guardado' : 'Guardar'}
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-3 py-1 text-xs"
                        onClick={toggleBlock}
                      >
                        <ShieldBan className="h-3.5 w-3.5" aria-hidden />
                        {isBlocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">
                    {unlocked
                      ? 'Recuerda: el enlace expira en minutos para proteger a los creadores.'
                      : media.visibility === 'ppv'
                      ? 'Desbloquea con tokens y disfruta al instante sin descargar.'
                      : 'Activa tu pase de 30 días para acceder a todo su contenido.'}
                  </p>
                  {media.visibility === 'ppv' && unlocked ? (
                    <Button size="sm" variant="outline">
                      Regalar al autor (Heart 20 Créditos TKN)
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <aside className="card flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Pase 30 días</h2>
        <p className="text-sm text-text-muted">Precio dentro del rango permitido (499-2999 Créditos TKN).</p>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-muted/50 bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold">Acceso ilimitado 30 días</p>
              <p className="text-xs text-text-muted">{formatTokens(demoProfile.passPrice)} · {euroEquivalent(demoProfile.passPrice)}</p>
            </div>
            <Button size="sm" onClick={handlePass}>
              Comprar pase
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={isBlocked ? 'default' : 'outline'} onClick={toggleBlock}>
            <ShieldBan className="mr-2 h-4 w-4" /> {isBlocked ? 'Desbloquear' : 'Bloquear'}
          </Button>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-xs text-accent">
          Earnings pendientes: {formatTokens(demoProfile.hasPendingEarnings)} · liberación automática en 7 días.
          {passSavings > 0 ? (
            <span className="ml-1 text-[0.7rem] text-text">
              Renueva tu pase y ahorra {formatTokens(passSavings)} frente a comprar PPV sueltos.
            </span>
          ) : null}
        </div>
        <div className="space-y-3 rounded-2xl border border-muted/60 bg-muted/20 p-4 text-xs text-text">
          <h3 className="text-sm font-semibold text-text">Comparte tu perfil</h3>
          <p className="text-text-muted">
            Inserta este widget en blogs o redes compatibles. Incluye CTA seguro hacia tu perfil en TKN.
          </p>
          <div className="overflow-hidden rounded-2xl border border-muted/40 bg-muted/20 p-4">
            <div className="flex items-center gap-3">
              <Image
                src={demoProfile.avatar}
                alt={`Miniatura de @${demoProfile.username}`}
                width={56}
                height={56}
                className="rounded-full border border-muted/50"
              />
              <div>
                <p className="text-sm font-semibold text-text">@{demoProfile.username}</p>
                <p className="text-xs text-text-muted">PPV, pase 30 días y gifts en vivo.</p>
                <p className="text-xs text-success">{formatTokens(demoProfile.passPrice)} pase mensual</p>
              </div>
            </div>
          </div>
          <pre className="max-h-36 overflow-y-auto rounded-xl bg-surface/80 p-3 text-[0.7rem] text-text/90">
            {embedCode}
          </pre>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await copyToClipboard(embedCode);
              toast.success('Código copiado');
            }}
          >
            Copiar código
          </Button>
        </div>
      </aside>
      <Dialog open={showBundleUpsell} onOpenChange={setShowBundleUpsell}>
        <DialogContent className="rounded-3xl border border-accent/20 bg-surface">
          <DialogHeader>
            <DialogTitle>Desbloquea más por menos</DialogTitle>
            <DialogDescription>
              Aprovecha el bundle premium antes de comprar piezas sueltas. El descuento se aplica automáticamente.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm text-text">
            {bundleItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <span>{item.title ?? item.id}</span>
                <span className="text-xs text-text-muted">{formatTokens(item.price ?? 0)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-muted">
            Bundle: {formatTokens(bundlePrice)} ·{' '}
            {formatFiatFromEur(bundlePrice / 100, session.preferredCurrency)} aprox.
          </p>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={confirmSingleUnlock} className="sm:flex-1">
              Solo este contenido
            </Button>
            <Button className="sm:flex-1" onClick={handleBundleUnlock}>
              Desbloquear los {bundleItems.length} por {formatTokens(bundlePrice)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
