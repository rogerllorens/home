'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MATCH_PREFERENCES, formatTokens, formatFiat, TOKEN_PACKS, CREDIT_RATE_NOTE } from '@/lib/utils';
import { useSession } from '@/components/session-provider';
import { Chip } from '@/components/ui/chip';
import { Tooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoTile } from '@/components/match/video-tile';
import { MatchControls } from '@/components/match/match-controls';
import { GiftDrawer } from '@/components/gifts/gift-drawer';
import { ChatDrawer } from '@/components/match/chat-drawer';
import { useUiStore } from '@/stores/ui-store';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { createSignalClient, useSignalState, type SignalMessage } from '@/lib/ws';
import { getMediaConstraints } from '@/lib/rtc';

export type MatchStatus = 'idle' | 'searching' | 'connecting' | 'connected' | 'error';

interface RemotePeer {
  sessionId: string;
  username: string;
}

interface MatchFoundPayload {
  roomId: string;
  peer: { sessionId?: string; username?: string };
  iceServers?: RTCIceServer[];
}

const FALLBACK_ICE: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' }
];

function randomRoomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `room-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

if (typeof process !== 'undefined') {
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  if (turnUrl) {
    FALLBACK_ICE.push({
      urls: [turnUrl],
      username: process.env.NEXT_PUBLIC_TURN_USER,
      credential: process.env.NEXT_PUBLIC_TURN_PASS
    });
  }
}

export function MatchPanel() {
  const t = useTranslations('match');
  const session = useSession();
  const router = useRouter();
  const signalStatus = useSignalState((state) => state.status);
  const authIdentity = useAuthStore(
    useCallback(
      (state) => ({
        sessionId: state.sessionId,
        scope: state.scope,
        username: state.username
      }),
      []
    )
  );
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(session.preferences);
  const [status, setStatus] = useState<MatchStatus>('idle');
  const [showSearching, setShowSearching] = useState(false);
  const { toggleGiftDrawer, giftBurst, giftBurstTokens, giftBurstName, resetGiftBurst, registerGiftEvent } =
    useUiStore();
  const [remoteBlurred, setRemoteBlurred] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState(100);
  const [tipLoading, setTipLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [lastMatch, setLastMatch] = useState<RemotePeer | null>(null);
  const [lastCallDuration, setLastCallDuration] = useState(0);
  const callStartRef = useRef<number | null>(null);

  const signalRef = useRef<ReturnType<typeof createSignalClient> | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remotePeer, setRemotePeer] = useState<RemotePeer | null>(null);
  const currentRoomRef = useRef<string | null>(null);

  const quickPacks = useMemo(() => TOKEN_PACKS.slice(0, 3), []);
  const euroBalance = formatFiat(session.tokenBalance, session.preferredCurrency);
  const tokensLeftToday = Math.max(session.spendingLimits.daily - session.spendingUsage.today, 0);
  const tokensLeftMonth = Math.max(session.spendingLimits.monthly - session.spendingUsage.month, 0);
  const euroTip = formatFiat(tipAmount, session.preferredCurrency);
  const isNextDisabled = cooldown > 0 || status === 'searching' || status === 'connecting';
  const nextTimer = status === 'searching' || status === 'connecting' ? Math.max(cooldown, 1) : cooldown;
  const remoteUserDisplay = useMemo(
    () => remotePeer?.username ?? t('waitingUser', { defaultValue: 'Buscando usuario…' }),
    [remotePeer, t]
  );

  useEffect(() => {
    session.setPreferences(selectedPrefs);
  }, [selectedPrefs, session]);

  useEffect(() => {
    if (status === 'searching') {
      setShowSearching(true);
    }
    if (status === 'idle') {
      setShowSearching(false);
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'connected') return;
    setRemoteBlurred(true);
    const timer = window.setTimeout(() => setRemoteBlurred(false), 2500);
    return () => window.clearTimeout(timer);
  }, [status, remotePeer]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    if (status === 'connected') {
      callStartRef.current = Date.now();
      setCooldown(0);
      setShowUpsell(false);
    } else if (status === 'idle') {
      callStartRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (giftBurst === 0) return;
    const timer = window.setTimeout(() => resetGiftBurst(), 2500);
    return () => window.clearTimeout(timer);
  }, [giftBurst, resetGiftBurst]);

  const determineInitiator = useCallback(
    (peerSessionId?: string) => {
      const myId = authIdentity.sessionId ?? session.alias;
      if (!peerSessionId) return true;
      if (!myId) return false;
      return myId.localeCompare(peerSessionId) <= 0;
    },
    [authIdentity.sessionId, session.alias]
  );

  const resetPeerConnection = useCallback(() => {
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    currentRoomRef.current = null;
  }, []);

  const ensureLocalMedia = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    if (localStreamRef.current) {
      return localStreamRef.current;
    }
    try {
      const constraints = getMediaConstraints(selectedPrefs);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: constraints.audio,
        video: constraints.video
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('match: media error', error);
      toast.error('No pudimos acceder a tu cámara o micrófono.');
      setStatus('error');
      return null;
    }
  }, [selectedPrefs]);

  const startPeerConnection = useCallback(
    async (payload: MatchFoundPayload) => {
      if (typeof window === 'undefined') return;
      const stream = await ensureLocalMedia();
      if (!stream) {
        return;
      }
      const peerSessionId = payload.peer.sessionId ?? '';
      const iceServers = payload.iceServers && payload.iceServers.length > 0 ? payload.iceServers : FALLBACK_ICE;
      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;
      currentRoomRef.current = payload.roomId;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const [remote] = event.streams;
        if (remote) {
          setRemoteStream(remote);
        }
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const to = peerSessionId || remotePeer?.sessionId || '';
        if (!to) return;
        signalRef.current?.send({
          type: 'RTC_SIGNAL',
          payload: { to, data: { type: 'candidate', candidate: event.candidate } }
        });
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setStatus('connected');
        } else if (state === 'failed') {
          toast.error('La conexión se ha caído.');
          resetPeerConnection();
          setRemotePeer(null);
          setStatus('idle');
        } else if (state === 'disconnected' || state === 'closed') {
          resetPeerConnection();
          setRemotePeer(null);
          setStatus('idle');
        }
      };

      setStatus('connecting');

      if (determineInitiator(peerSessionId || remotePeer?.sessionId)) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const to = peerSessionId || remotePeer?.sessionId || '';
          if (to) {
            signalRef.current?.send({
              type: 'RTC_SIGNAL',
              payload: { to, data: { type: 'offer', sdp: offer.sdp } }
            });
          }
        } catch (error) {
          console.error('match: offer error', error);
          toast.error('No se pudo iniciar la videollamada.');
          setStatus('error');
        }
      }
    },
    [determineInitiator, ensureLocalMedia, remotePeer, resetPeerConnection]
  );

  const handleSignalMessage = useCallback(
    async (message: SignalMessage) => {
      switch (message.type) {
        case 'WELCOME': {
          if (status === 'searching') {
            signalRef.current?.send({
              type: 'TICKET_CREATE',
              payload: { consents: selectedPrefs }
            });
          }
          break;
        }
        case 'MATCH_FOUND': {
          const payload = message.payload as MatchFoundPayload;
          const username = payload.peer.username ?? 'Invitado';
          const sessionId = payload.peer.sessionId ?? username;
          setRemotePeer({ sessionId, username });
          setShowSearching(false);
          setCooldown(0);
          await startPeerConnection(payload);
          break;
        }
        case 'RTC_SIGNAL': {
          const payload = message.payload as { from?: string; data?: any };
          if (!payload?.data) return;
          const pc = peerConnectionRef.current;
          if (payload.data.type === 'offer') {
            const stream = await ensureLocalMedia();
            if (!stream) return;
            if (!pc) {
              if (remotePeer) {
                await startPeerConnection({
                  roomId: currentRoomRef.current ?? randomRoomId(),
                  peer: { sessionId: remotePeer.sessionId, username: remotePeer.username },
                  iceServers: FALLBACK_ICE
                });
              } else {
                return;
              }
            }
            const connection = peerConnectionRef.current;
            if (!connection) return;
            await connection.setRemoteDescription(
              new RTCSessionDescription({ type: 'offer', sdp: payload.data.sdp })
            );
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            const to = payload.from ?? remotePeer?.sessionId ?? '';
            if (to) {
              signalRef.current?.send({
                type: 'RTC_SIGNAL',
                payload: { to, data: { type: 'answer', sdp: answer.sdp } }
              });
            }
            break;
          }
          if (!pc) return;
          if (payload.data.type === 'answer') {
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: 'answer', sdp: payload.data.sdp })
            );
          } else if (payload.data.type === 'candidate') {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.data.candidate));
            } catch (error) {
              console.error('match: candidate error', error);
            }
          } else if (payload.data.type === 'bye') {
            if (status === 'connected' && remotePeer) {
              setLastMatch(remotePeer);
            }
            resetPeerConnection();
            setRemotePeer(null);
            setRemoteStream(null);
            setStatus('idle');
            setShowUpsell(false);
          }
          break;
        }
        case 'SLOWMODE_ACTIVE': {
          toast.info('Cooldown activo, espera unos segundos.');
          break;
        }
        default:
          break;
      }
    },
    [ensureLocalMedia, remotePeer, resetPeerConnection, selectedPrefs, startPeerConnection, status]
  );

  const ensureSignalClient = useCallback(() => {
    if (typeof window === 'undefined') return;
    const identity = {
      sessionId: authIdentity.sessionId ?? session.alias,
      userId: session.username ?? session.alias,
      scope: authIdentity.scope
    };
    if (!signalRef.current) {
      const client = createSignalClient({ identity });
      signalRef.current = client;
      client.connect();
      client.addListener(handleSignalMessage);
    } else {
      signalRef.current.updateIdentity(identity);
    }
  }, [authIdentity.scope, authIdentity.sessionId, handleSignalMessage, session.alias, session.username]);

  useEffect(() => {
    ensureSignalClient();
    return () => {
      signalRef.current?.disconnect();
      signalRef.current = null;
      resetPeerConnection();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [ensureSignalClient, resetPeerConnection]);

  const requestMatchTicket = useCallback(() => {
    ensureSignalClient();
    if (signalStatus !== 'connected') {
      toast.info('Conectando con la señalización…');
    }
    signalRef.current?.send({
      type: 'TICKET_CREATE',
      payload: { consents: selectedPrefs }
    });
    setShowSearching(true);
    setStatus('searching');
  }, [ensureSignalClient, selectedPrefs, signalStatus]);

  const togglePref = (id: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(id) ? prev.filter((pref) => pref !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (isNextDisabled) return;
    if (status === 'connected' && remotePeer) {
      setLastMatch(remotePeer);
      if (callStartRef.current) {
        const duration = Math.round((Date.now() - callStartRef.current) / 1000);
        setLastCallDuration(Math.max(duration, 0));
      }
      setShowUpsell(true);
      callStartRef.current = null;
    }
    if (remotePeer?.sessionId) {
      signalRef.current?.send({
        type: 'RTC_SIGNAL',
        payload: { to: remotePeer.sessionId, data: { type: 'bye' } }
      });
    }
    resetPeerConnection();
    setRemotePeer(null);
    setRemoteStream(null);
    setCooldown(3);
    requestMatchTicket();
  };

  const handleReport = () => {
    toast('¡Report enviado!', {
      description: 'Nuestro equipo revisará la sesión en minutos.'
    });
  };

  const handleRecharge = () => {
    router.push('/wallet');
  };

  const handleTipChange = (value: string) => {
    const numeric = Number.parseInt(value, 10);
    if (Number.isNaN(numeric)) {
      setTipAmount(0);
      return;
    }
    setTipAmount(Math.max(numeric, 10));
  };

  const handleDirectTip = () => {
    if (!remotePeer) {
      toast.error('Necesitamos un match activo para enviar créditos.');
      return;
    }
    setShowTipDialog(true);
  };

  const handleConfirmTip = async () => {
    if (tipAmount <= 0 || !remotePeer) {
      toast.error('Introduce un importe válido en créditos.');
      return;
    }
    setTipLoading(true);
    try {
      const success = await session.spend(tipAmount, 'Tip directo', {
        metadata: { context: 'match-tip', targetUser: remotePeer.sessionId },
        execute: async () => new Promise((resolve) => setTimeout(resolve, 320))
      });
      if (success) {
        toast.success(`Enviaste ${formatTokens(tipAmount)} a ${remotePeer.username}`);
        registerGiftEvent({ name: 'Tip directo', tokens: tipAmount });
        setShowTipDialog(false);
      }
    } finally {
      setTipLoading(false);
    }
  };

  const handleFollowLast = () => {
    if (!lastMatch) return;
    session.toggleFollowUser(lastMatch.username);
    toast.success(`Sigues a @${lastMatch.username}`);
    setShowUpsell(false);
  };

  const handleOpenProfile = () => {
    if (!lastMatch) return;
    router.push(`/u/${lastMatch.username}`);
    setShowUpsell(false);
  };

  const handleOpenDm = () => {
    toast.info('Chat privado disponible en la versión conectada a Signal.');
    setShowUpsell(false);
  };

  const handleUnlockContent = () => {
    toast.info('Desbloquea PPV desde el perfil del creador.');
    setShowUpsell(false);
  };

  const handleRenewPass = () => {
    toast.success('Recibirás un -10% automático al renovar el pase antes de 48h.');
    setShowUpsell(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-text-muted">{t('consents')}</span>
        {MATCH_PREFERENCES.map((pref) => (
          <Tooltip key={pref.id} label={pref.description} side="bottom">
            <Chip selected={selectedPrefs.includes(pref.id)} onClick={() => togglePref(pref.id)}>
              {pref.label}
            </Chip>
          </Tooltip>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-muted/60 bg-muted/20 p-4">
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-text">Videollamada random 1:1 sin coste</p>
          <p className="text-xs text-text-muted">
            El botón “Next” es gratuito e incluye un cooldown anti-spam de 3 segundos. Los reportes pueden activar
            shadowban automático.
          </p>
          <p className="text-xs text-text-muted">
            Prioridad de matching: país {session.countryCode ?? '??'} y preferencias compartidas.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-text-muted">
          <span className="text-sm font-semibold text-text">
            Saldo: {formatTokens(session.tokenBalance)} · {euroBalance}
          </span>
          <span>{CREDIT_RATE_NOTE}</span>
          <span>
            Control gasto diario: {formatTokens(tokensLeftToday)} · Mensual: {formatTokens(tokensLeftMonth)}
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            {quickPacks.map((pack) => (
              <Button
                key={pack.id}
                size="xs"
                variant="secondary"
                onClick={() => router.push(`/wallet?highlight=${pack.id}`)}
              >
                {pack.name} · {pack.amount.toLocaleString('es-ES')} TKN
              </Button>
            ))}
            <Button size="xs" onClick={handleRecharge}>
              Recargar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <section className="space-y-4">
          {showSearching ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-muted/60 bg-muted/20 p-12 text-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <p className="text-lg font-semibold text-text">{t('searching')}</p>
              <p className="text-sm text-text-muted">Coincidiremos contigo en menos de 3 segundos.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <VideoTile
                label={remoteUserDisplay}
                stream={remoteStream ?? undefined}
                placeholder={<span className="token-pill">{status === 'connected' ? 'Sin video remoto' : t('waiting')}</span>}
                isBlurred={remoteBlurred}
              >
                {giftBurst > 0 ? (
                  <div className="pointer-events-none absolute top-4 right-4 flex flex-col items-end gap-1 rounded-2xl bg-black/60 px-3 py-2 text-xs font-semibold text-text">
                    <span className="flex items-center gap-1 text-sm text-accent">
                      🎁 {giftBurst}x {giftBurstName ?? 'Gift'}
                    </span>
                    <span className="text-[0.7rem] text-text-muted">-{formatTokens(giftBurstTokens)}</span>
                  </div>
                ) : null}
              </VideoTile>
              <div className="flex flex-col gap-3">
                <VideoTile
                  label={session.alias}
                  stream={localStream ?? undefined}
                  placeholder={<span className="text-xs text-text-muted">Tu cámara aparecerá aquí</span>}
                  isLocal
                />
                <div className="rounded-3xl border border-muted/60 bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-text">{remoteUserDisplay}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {remotePeer ? 'Match activo' : 'Aún no hay datos del perfil remoto.'}
                  </p>
                  <p className="mt-2 text-[0.7rem] text-text-muted">
                    Envía créditos directos para propinas rápidas. El receptor verá siempre la conversión TKN ⇄ €.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleGiftDrawer(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-3 py-1 text-sm text-accent transition hover:border-accent hover:text-accent-2"
                    >
                      🎁 Enviar regalo
                    </button>
                    <button
                      onClick={handleDirectTip}
                      className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-3 py-1 text-sm text-accent transition hover:border-accent hover:text-accent-2"
                    >
                      💸 Créditos directos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'error' ? (
            <div className="rounded-3xl border border-warn bg-warn/10 p-4 text-sm text-warn">{t('error')}</div>
          ) : status === 'connecting' ? (
            <div className="rounded-3xl border border-muted/60 bg-muted/30 p-4 text-sm text-text-muted">{t('connecting')}</div>
          ) : null}

          <MatchControls
            onNext={handleNext}
            onReport={handleReport}
            remoteUsername={remoteUserDisplay}
            onDirectTip={handleDirectTip}
            onRecharge={handleRecharge}
            nextDisabled={isNextDisabled}
            nextCooldown={nextTimer}
          />
        </section>

        <aside className="space-y-4 rounded-3xl border border-muted/60 bg-muted/30 p-6">
          <h3 className="text-lg font-semibold text-text">Tips para un buen match</h3>
          <ul className="space-y-3 text-sm text-text-muted">
            <li>Comprueba tu conexión y activa blur si quieres más privacidad.</li>
            <li>Usa regalos para romper el hielo. El receptor recibe el 70%.</li>
            <li>Reporta cualquier comportamiento inadecuado.</li>
          </ul>
        </aside>
      </div>

      <GiftDrawer />
      <ChatDrawer />
      <Dialog open={showTipDialog} onOpenChange={(open) => (!open ? setShowTipDialog(false) : null)}>
        <DialogContent className="max-w-md rounded-3xl border border-muted/60 bg-surface">
          <DialogHeader>
            <DialogTitle>Enviar créditos directos</DialogTitle>
            <DialogDescription>
              Envía propinas instantáneas sin animación de regalo. El creador recibe el 70%.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Saldo actual: {formatTokens(session.tokenBalance)} · {euroBalance}
            </p>
            <Input type="number" min={10} step={10} value={tipAmount} onChange={(event) => handleTipChange(event.target.value)} />
            <p className="text-xs text-text-muted">
              Este envío equivale a {euroTip}. Te quedan {formatTokens(tokensLeftToday)} disponibles hoy antes de alcanzar tu
              límite personal.
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowTipDialog(false)} disabled={tipLoading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmTip} disabled={tipLoading}>
              {tipLoading ? 'Enviando…' : 'Confirmar envío'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showUpsell} onOpenChange={(open) => (!open ? setShowUpsell(false) : null)}>
        <DialogContent className="max-w-lg rounded-3xl border border-muted/60 bg-surface">
          <DialogHeader>
            <DialogTitle>Continúa con {lastMatch?.username ?? 'tu match'}</DialogTitle>
            <DialogDescription>
              La videollamada duró {lastCallDuration || 0} segundos. Elige cómo mantener la conexión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-text-muted">
            <Button className="w-full justify-start" variant="secondary" onClick={handleFollowLast}>
              Seguir perfil
            </Button>
            <Button className="w-full justify-start" variant="secondary" onClick={handleOpenDm}>
              Abrir chat privado
            </Button>
            <Button className="w-full justify-start" variant="secondary" onClick={handleOpenProfile}>
              Desbloquear contenido PPV
            </Button>
            <Button className="w-full justify-start" variant="secondary" onClick={handleRenewPass}>
              Pase 30 días (-10 % si renuevas ahora)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
