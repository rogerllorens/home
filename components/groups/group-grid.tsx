import { GroupRoomSummary } from '@/lib/api';
import { GroupCard } from '@/components/groups/group-card';

interface Props {
  rooms: GroupRoomSummary[];
}

export function GroupGrid({ rooms }: Props) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => (
        <GroupCard key={room.id} room={room} />
      ))}
    </div>
  );
}
