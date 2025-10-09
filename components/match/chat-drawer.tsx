'use client';

import { Drawer } from '@/components/ui/drawer';
import { useUiStore } from '@/stores/ui-store';
import { ChatPanel, type ChatParticipant } from '@/components/chat/chat-panel';

const MATCH_PARTICIPANTS: ChatParticipant[] = [
  { id: 'self', username: 'Tú', isSelf: true },
  { id: 'peer', username: 'mystique', avatar: 'https://placehold.co/48x48/121820/E5E7EB?text=M' }
];

export function ChatDrawer() {
  const { isChatDrawerOpen, toggleChatDrawer } = useUiStore();

  return (
    <Drawer open={isChatDrawerOpen} onOpenChange={toggleChatDrawer} title="Chat en vivo">
      <ChatPanel
        context="match"
        participants={MATCH_PARTICIPANTS}
        placeholder="Rompe el hielo con un mensaje respetuoso…"
      />
    </Drawer>
  );
}
