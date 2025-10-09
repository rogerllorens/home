'use client';

import {
  Gift,
  MessageCircle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  EyeOff,
  Flag,
  RotateCw,
  BellOff,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useUiStore } from '@/stores/ui-store';
import { useState } from 'react';
import { useSession } from '@/components/session-provider';

interface Props {
  onNext: () => void;
  onReport: () => void;
  remoteUsername: string;
  onDirectTip: () => void;
  onRecharge: () => void;
  nextDisabled?: boolean;
  nextCooldown?: number;
}

export function MatchControls({
  onNext,
  onReport,
  remoteUsername,
  onDirectTip,
  onRecharge,
  nextDisabled,
  nextCooldown
}: Props) {
  const { toggleChatDrawer, toggleGiftDrawer } = useUiStore();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const session = useSession();

  const muteRemote = () => {
    session.muteUser(remoteUsername);
  };

  const blockRemote = () => {
    session.blockUser(remoteUsername);
  };

  return (
    <div className="pointer-events-none relative mt-6 flex flex-col items-center gap-3">
      <div className="pointer-events-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-3 rounded-full border border-muted/70 bg-surface/90 px-5 py-3 shadow-2xl backdrop-blur">
        <Tooltip
          label={nextDisabled ? `Cooldown anti-spam activo (${nextCooldown ?? 0}s)` : 'Pasar al siguiente match gratis'}
          side="top"
        >
          <Button size="lg" className="rounded-full" onClick={onNext} disabled={nextDisabled}>
            <RotateCw className="mr-2 h-4 w-4" aria-hidden />
            {nextDisabled && typeof nextCooldown === 'number'
              ? `Siguiente (${Math.max(nextCooldown, 0)}s)`
              : 'Siguiente'}
          </Button>
        </Tooltip>
        <Tooltip label="Enviar regalo" side="top">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={() => toggleGiftDrawer(true)}
          >
            <Gift className="mr-2 h-4 w-4" aria-hidden /> Gifts
          </Button>
        </Tooltip>
        <Tooltip label="Enviar créditos directos" side="top">
          <Button type="button" variant="secondary" className="rounded-full" onClick={onDirectTip}>
            <Gift className="mr-2 h-4 w-4 rotate-12" aria-hidden /> Tokens
          </Button>
        </Tooltip>
        <Tooltip label="Abrir chat" side="top">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => toggleChatDrawer(true)}
          >
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden /> Chat
          </Button>
        </Tooltip>
        <Tooltip label="Recargar créditos en la llamada" side="top">
          <Button type="button" variant="outline" className="rounded-full" onClick={onRecharge}>
            <RotateCw className="mr-2 h-4 w-4" aria-hidden /> Recargar
          </Button>
        </Tooltip>
        <Tooltip label="Reportar sesión" side="top">
          <Button type="button" variant="ghost" className="rounded-full" onClick={onReport}>
            <Flag className="mr-2 h-4 w-4" aria-hidden /> Reportar
          </Button>
        </Tooltip>
      </div>
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-muted/30 px-4 py-2 text-xs font-semibold text-text">
        <Tooltip label={muted ? 'Activar micro' : 'Silenciar micro'}>
          <Button type="button" size="icon" variant="ghost" onClick={() => setMuted((prev) => !prev)}>
            {muted ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
            <span className="sr-only">Micro</span>
          </Button>
        </Tooltip>
        <Tooltip label={videoOff ? 'Activar cámara' : 'Desactivar cámara'}>
          <Button type="button" size="icon" variant="ghost" onClick={() => setVideoOff((prev) => !prev)}>
            {videoOff ? <VideoOff className="h-4 w-4" aria-hidden /> : <Video className="h-4 w-4" aria-hidden />}
            <span className="sr-only">Cámara</span>
          </Button>
        </Tooltip>
        <Tooltip label={blurEnabled ? 'Quitar blur' : 'Activar blur suave'}>
          <Button type="button" size="icon" variant="ghost" onClick={() => setBlurEnabled((prev) => !prev)}>
            <EyeOff className="h-4 w-4" aria-hidden />
            <span className="sr-only">Blur</span>
          </Button>
        </Tooltip>
        <Tooltip label="Silenciar usuario">
          <Button type="button" size="icon" variant="ghost" onClick={muteRemote}>
            <BellOff className="h-4 w-4" aria-hidden />
            <span className="sr-only">Silenciar usuario</span>
          </Button>
        </Tooltip>
        <Tooltip label="Bloquear y evitar futuros matches">
          <Button type="button" size="icon" variant="ghost" onClick={blockRemote}>
            <ShieldAlert className="h-4 w-4" aria-hidden />
            <span className="sr-only">Bloquear</span>
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
