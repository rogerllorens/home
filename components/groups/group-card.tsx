
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Lock, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupRoomSummary } from '@/lib/api';
import { formatTokens } from '@/lib/utils';
import { toast } from 'sonner';
import { GroupRoomPreview } from '@/components/groups/group-room-preview';

interface Props {
  room: GroupRoomSummary;
}

export function GroupCard({ room }: Props) {
  const [showPreview, setShowPreview] = useState(false);

  const handleJoin = () => {
    if (room.vipPrice) {
      toast('Sala VIP', {
        description: `Se cobrarán ${formatTokens(room.vipPrice)} para acceder.`
      });
    } else {
      toast.success('Conectando a la sala...');
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-muted/60 bg-muted/30 p-6 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-text">{room.title}</h3>
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Users className="h-4 w-4" /> {room.participants}/6
          </span>
        </div>
        {room.vipPrice ? (
          <Badge variant="outline" className="gap-1 text-xs">
            <Lock className="h-3 w-3" /> VIP · {formatTokens(room.vipPrice)}
          </Badge>
        ) : (
          <Badge className="text-xs">Acceso libre</Badge>
        )}
        <p className="text-sm text-text-muted">
          {room.nowPlaying ?? 'Sala optimizada para ≤6 personas, audio SFU y gifts en tiempo real.'}
        </p>
        <div className="flex items-center gap-2">
          {(room.preview ?? []).slice(0, 4).map((participant) => (
            <div key={participant.username} className="relative h-9 w-9 overflow-hidden rounded-full border border-muted/40">
              <Image
                src={participant.avatar}
                alt={participant.username}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
              {participant.isMuted ? (
                <span className="absolute bottom-0 right-0 inline-flex h-3 w-3 items-center justify-center rounded-full bg-muted text-[0.5rem] text-text">
                  🔇
                </span>
              ) : null}
            </div>
          ))}
          {(room.preview ?? []).length > 4 ? (
            <span className="rounded-full bg-muted/40 px-2 py-1 text-xs text-text-muted">
              {(room.preview?.length ?? 0) - 4}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <Button className="flex-1" onClick={handleJoin}>
          {room.vipPrice ? 'Comprar ticket' : 'Unirse'}
        </Button>
        <Button variant="outline" onClick={() => setShowPreview(true)}>
          <Eye className="mr-2 h-4 w-4" /> Ver lobby
        </Button>
      </div>
      <GroupRoomPreview room={room} open={showPreview} onOpenChange={setShowPreview} />
    </div>
  );
}
