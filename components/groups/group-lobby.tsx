'use client';

import { useState } from 'react';
import { GroupRoomSummary } from '@/lib/api';
import { GroupGrid } from '@/components/groups/group-grid';
import { GroupCreateDialog } from '@/components/groups/group-create-dialog';
import { toast } from 'sonner';

interface Props {
  initialRooms: GroupRoomSummary[];
}

export function GroupLobby({ initialRooms }: Props) {
  const [rooms, setRooms] = useState(initialRooms);

  const handleCreate = (values: { title?: string; vipPrice?: number }) => {
    const newRoom: GroupRoomSummary = {
      id: `room-${Date.now()}`,
      title: values.title?.trim() || 'Sala sin título',
      participants: 0,
      vipPrice: values.vipPrice
    };
    setRooms((prev) => [newRoom, ...prev]);
    toast.success('Sala creada');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-semibold text-text">Salas activas</h2>
          <p className="text-sm text-text-muted">Hasta 6 personas con SFU propio y gifts sincronizados.</p>
        </div>
        <GroupCreateDialog onCreate={handleCreate} />
      </div>
      <GroupGrid rooms={rooms} />
    </div>
  );
}
