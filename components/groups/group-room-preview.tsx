'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { ChatPanel, type ChatParticipant } from '@/components/chat/chat-panel';
import { GroupRoomSummary } from '@/lib/api';
import { formatTokens } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  room: GroupRoomSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const placeholderStreams = [
  'https://placehold.co/320x180/0B0F14/E5E7EB?text=Stream+1',
  'https://placehold.co/320x180/121820/E5E7EB?text=Stream+2',
  'https://placehold.co/320x180/1B2330/E5E7EB?text=Stream+3',
  'https://placehold.co/320x180/0B0F14/E5E7EB?text=Stream+4',
  'https://placehold.co/320x180/121820/E5E7EB?text=Stream+5',
  'https://placehold.co/320x180/1B2330/E5E7EB?text=Stream+6'
];

export function GroupRoomPreview({ room, open, onOpenChange }: Props) {
  const [isJoining, setIsJoining] = useState(false);

  const participants: ChatParticipant[] = useMemo(
    () =>
      (room.preview ?? []).map((participant) => ({
        id: participant.username,
        username: participant.username,
        avatar: participant.avatar ?? 'https://placehold.co/48x48/121820/E5E7EB?text=?',
        isMuted: participant.isMuted
      })),
    [room.preview]
  );

  const handleJoin = () => {
    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      toast.success(room.vipPrice ? 'Ticket VIP cobrado' : 'Conectando a la sala');
      onOpenChange(false);
    }, 700);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Lobby · ${room.title}`}
      description={
        room.vipPrice
          ? `Previsualiza la sala antes de pagar ${formatTokens(room.vipPrice)}.`
          : 'Mira quién está conectado antes de entrar.'
      }
    >
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          {placeholderStreams.slice(0, 4).map((src, index) => (
            <div key={src} className="relative overflow-hidden rounded-3xl border border-muted/40">
              <Image src={src} alt={`Vista previa ${index + 1}`} width={320} height={180} className="h-full w-full object-cover" />
              {room.preview?.[index] ? (
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[0.7rem] text-text">
                  @{room.preview[index].username}
                  {room.preview[index].isMuted ? '🔇' : '🔊'}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-muted/40 bg-muted/30 p-4 text-sm text-text-muted">
          <p>{room.nowPlaying ?? 'Sala optimizada para ≤6 personas con gifts y blur anti-spoilers.'}</p>
          <p className="mt-2 text-xs">Las salas VIP cobran ticket solo una vez por sesión. Si pierdes conexión podrás reingresar.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <ChatPanel
            context="group"
            participants={[{ id: 'self', username: 'Tú', isSelf: true }, ...participants]}
            placeholder="Saluda antes de entrar o pregunta sobre la sala…"
            emptyState="Aún no se ha hablado en este lobby. Envía tus dudas antes de comprar el ticket."
          />
          <aside className="space-y-4 rounded-3xl border border-muted/40 bg-muted/20 p-4 text-sm">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-text">Quién está dentro</h3>
              <ul className="space-y-2">
                {(room.preview ?? []).map((participant) => (
                  <li key={participant.username} className="flex items-center gap-3 text-xs text-text">
                    <Image
                      src={participant.avatar ?? 'https://placehold.co/48x48/121820/E5E7EB?text=?'}
                      alt={participant.username}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <span>@{participant.username}</span>
                    <span className="ml-auto text-text-muted">{participant.isMuted ? 'Mute' : 'Hablando'}</span>
                  </li>
                ))}
                {(room.preview ?? []).length === 0 ? (
                  <li className="text-xs text-text-muted">Sin asistentes todavía. ¡Invita a tus amigos!</li>
                ) : null}
              </ul>
            </div>
            <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/10 p-3 text-xs text-accent">
              Comparte la sala usando tu link de referidos y gana créditos (TKN) si compran un ticket VIP.
            </div>
            <Button className="w-full" onClick={handleJoin} disabled={isJoining}>
              {isJoining ? 'Procesando…' : room.vipPrice ? `Comprar ticket (${formatTokens(room.vipPrice)})` : 'Entrar a la sala'}
            </Button>
          </aside>
        </div>
      </div>
    </Modal>
  );
}
