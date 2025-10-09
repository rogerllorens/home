'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, CheckCheck, Gift, Heart, Loader2, MessageCircleReply, Reply, Smile, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, formatFiat, formatRelativeTime, TOKEN_PACKS, CREDIT_RATE_NOTE, formatTokens } from '@/lib/utils';
import { useSession } from '@/components/session-provider';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/tooltip';

export type ChatContext = 'match' | 'group' | 'support';

export interface ChatParticipant {
  id: string;
  username: string;
  avatar?: string;
  isMuted?: boolean;
  isSelf?: boolean;
}

export interface ChatMessage {
  id: string;
  author: ChatParticipant;
  body: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  replyToId?: string;
  system?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  pinned?: boolean;
  reactions?: Record<string, number>;
  myReactions?: string[];
}

interface ChatPanelProps {
  context: ChatContext;
  participants?: ChatParticipant[];
  initialMessages?: ChatMessage[];
  placeholder?: string;
  onMessageSend?: (
    message: ChatMessage,
    helpers: {
      markDelivered: () => void;
      markRead: () => void;
      markFailed: (reason?: string) => void;
    }
  ) => Promise<void> | void;
  onSearch?: (term: string) => Promise<ChatMessage[]>;
  onPinToggle?: (messageId: string, pinned: boolean) => Promise<void> | void;
  emptyState?: string;
  slowModeSeconds?: number;
  reactionsOptions?: readonly string[];
  allowDirectTip?: boolean;
  showInlineTopup?: boolean;
}

const messagePlaceholder: Record<ChatContext, string> = {
  match: 'Rompe el hielo con respeto…',
  group: 'Saluda a la sala o comparte la temática…',
  support: 'Escribe tu mensaje para soporte…'
};

const defaultEmptyState: Record<ChatContext, string> = {
  match: 'No hay mensajes todavía. Sé quien inicia la conversación ✨',
  group: 'El chat de la sala está en silencio. Envía el primer mensaje.',
  support: 'Aún no has escrito nada. Estamos aquí para ayudarte.'
};

const REACTIONS = ['❤️', '😂', '🔥', '👍'] as const;

export function ChatPanel({
  context,
  participants = [],
  initialMessages,
  placeholder,
  onMessageSend,
  onSearch,
  onPinToggle,
  emptyState,
  slowModeSeconds: slowModeSecondsProp,
  reactionsOptions,
  allowDirectTip = true,
  showInlineTopup = true
}: ChatPanelProps) {
  const session = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>(
    () =>
      initialMessages ?? [
        {
          id: 'welcome-msg',
          author: {
            id: 'system',
            username: context === 'group' ? 'Moderación' : 'Sistema',
            avatar: undefined,
            isMuted: true
          },
          body:
            context === 'match'
              ? 'Respeta consentimientos y usa gifts para romper el hielo.'
              : 'Recuerda las reglas básicas: consentimiento, respeto y reporta cualquier abuso.',
          createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          likes: 4,
          system: true,
          status: 'read',
          pinned: true
        }
      ]
  );
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState(50);
  const [tipLoading, setTipLoading] = useState(false);
  const [lastSendAt, setLastSendAt] = useState<number | null>(null);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const slowModeSeconds = slowModeSecondsProp ?? (context === 'group' ? 5 : context === 'match' ? 3 : 0);
  const reactions = reactionsOptions ?? REACTIONS;
  const euroTip = formatFiat(tipAmount, session.preferredCurrency);
  const needsTopup = session.tokenBalance < 500;
  const quickPacks = TOKEN_PACKS.slice(0, 2);
  const tokensLeftToday = Math.max(session.spendingLimits.daily - session.spendingUsage.today, 0);
  const tokensLeftMonth = Math.max(session.spendingLimits.monthly - session.spendingUsage.month, 0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTipAmountChange = (value: string) => {
    const numeric = Number.parseInt(value, 10);
    if (Number.isNaN(numeric)) {
      setTipAmount(0);
      return;
    }
    setTipAmount(Math.max(numeric, 10));
  };

  const handleDirectTip = () => {
    setShowTipDialog(true);
  };

  const handleConfirmTip = async () => {
    if (tipAmount <= 0) {
      toast.error('Introduce un importe válido en créditos.');
      return;
    }
    setTipLoading(true);
    try {
      const success = await session.spend(tipAmount, 'Tip directo chat', {
        metadata: { context: 'chat', channel: context },
        execute: async () => new Promise((resolve) => setTimeout(resolve, 300))
      });
      if (success) {
        toast.success(`Enviaste ${formatTokens(tipAmount)} en el chat.`);
        setShowTipDialog(false);
      }
    } finally {
      setTipLoading(false);
    }
  };

  const redirectToWallet = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/wallet');
    }
  };

  const messageMap = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const visibleMessages = useMemo(() => {
    if (searchResults) {
      return searchResults;
    }
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return messages;
    return messages.filter((message) => {
      if (message.system) return true;
      const haystack = `${message.author.username} ${message.body}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [messages, searchResults, searchTerm]);

  const pinnedMessages = useMemo(() => messages.filter((message) => message.pinned), [messages]);
  const hasSearchActive = Boolean(searchResults || searchTerm.trim().length > 0);

  const composerPlaceholder = placeholder ?? messagePlaceholder[context];
  const emptyCopy = emptyState ?? defaultEmptyState[context];

  useEffect(() => {
    if (context === 'support') return;
    const start = window.setTimeout(() => setRemoteTyping(true), 4500);
    const stop = window.setTimeout(() => setRemoteTyping(false), 6500);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [messages.length, context]);

  useEffect(() => {
    if (!onSearch) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    const query = searchTerm.trim();
    if (query.length === 0) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    onSearch(query)
      ?.then((results) => {
        if (!cancelled) {
          setSearchResults(results);
          setIsSearching(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSearchResults([]);
          setIsSearching(false);
          const reason = error instanceof Error ? error.message : undefined;
          toast.error(reason ?? 'No se pudo buscar en el chat.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [searchTerm, onSearch]);

  const updateMessageStatus = (messageId: string, status: ChatMessage['status']) => {
    setMessages((prev) =>
      prev.map((item) => (item.id === messageId ? { ...item, status } : item))
    );
  };

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const now = Date.now();
    if (slowModeSeconds > 0 && lastSendAt && now - lastSendAt < slowModeSeconds * 1000) {
      const remaining = slowModeSeconds - Math.floor((now - lastSendAt) / 1000);
      toast.warning(`Modo lento activo. Espera ${Math.max(remaining, 1)}s antes de enviar otro mensaje.`);
      return;
    }
    const selfParticipant: ChatParticipant =
      participants.find((participant) => participant.isSelf) ??
      ({ id: session.username, username: session.username } as ChatParticipant);
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      author: selfParticipant,
      body: trimmed,
      createdAt: new Date().toISOString(),
      likes: 0,
      replyToId: replyTo?.id,
      status: 'sent'
    };
    setMessages((prev) => [...prev, message]);
    setDraft('');
    setReplyTo(null);
    const helpers = {
      markDelivered: () => updateMessageStatus(message.id, 'delivered'),
      markRead: () => updateMessageStatus(message.id, 'read'),
      markFailed: (reason?: string) => {
        updateMessageStatus(message.id, 'sent');
        if (reason) {
          toast.error(reason);
        }
      }
    };
    try {
      if (onMessageSend) {
        await onMessageSend(message, helpers);
      } else {
        helpers.markDelivered();
        helpers.markRead();
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : undefined;
      helpers.markFailed(reason ?? 'No se pudo enviar el mensaje.');
    }
    setShowMentions(false);
    setLastSendAt(now);
    if (session.scope === 'user') {
      session.addNotification({
        type: 'comment',
        message: `Nuevo mensaje enviado en el chat ${context === 'group' ? 'grupal' : '1:1'}.`
      });
    }
  };

  const toggleLike = (messageId: string) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== messageId) return message;
        const liked = !message.likedByMe;
        return {
          ...message,
          likedByMe: liked,
          likes: Math.max((message.likes ?? 0) + (liked ? 1 : -1), 0)
        };
      })
    );
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== messageId) return message;
        const myReactions = new Set(message.myReactions ?? []);
        const reactions = { ...(message.reactions ?? {}) };
        if (myReactions.has(emoji)) {
          myReactions.delete(emoji);
          reactions[emoji] = Math.max((reactions[emoji] ?? 1) - 1, 0);
          if (reactions[emoji] === 0) {
            delete reactions[emoji];
          }
        } else {
          myReactions.add(emoji);
          reactions[emoji] = (reactions[emoji] ?? 0) + 1;
        }
        return {
          ...message,
          reactions,
          myReactions: Array.from(myReactions)
        };
      })
    );
  };

  const togglePin = (messageId: string) => {
    const target = messageMap.get(messageId);
    if (!target) return;
    const nextPinned = !target.pinned;
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              pinned: nextPinned
            }
          : message
      )
    );
    if (onPinToggle) {
      Promise.resolve(onPinToggle(messageId, nextPinned)).catch((error) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  pinned: !nextPinned
                }
              : message
          )
        );
        const reason = error instanceof Error ? error.message : undefined;
        toast.error(reason ?? 'No se pudo actualizar el pin del mensaje.');
      });
    }
  };

  const handleReply = (message: ChatMessage) => {
    if (message.system) return;
    setReplyTo(message);
  };

  const handleInsertMention = (participant: ChatParticipant) => {
    const tag = `@${participant.username}`;
    if (draft.includes(tag)) {
      setShowMentions(false);
      return;
    }
    setDraft((prev) => `${prev}${prev.endsWith(' ') || prev.length === 0 ? '' : ' '}${tag} `);
    setShowMentions(false);
  };

  const clearReply = () => setReplyTo(null);

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleLongPressStart = (message: ChatMessage) => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = window.setTimeout(() => {
      if (message.system) return;
      handleReply(message);
      if (!message.pinned) {
        togglePin(message.id);
        toast.info('Mensaje fijado rápidamente. Puedes verlo en la sección de destacados.');
      }
    }, 550);
  };

  return (
    <>
      <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[0.65rem] text-text-muted">
          <span className="font-semibold uppercase tracking-wide">Buscar</span>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Busca mensajes, autores o enlaces"
            className="h-8 w-56"
            aria-label="Buscar en la conversación"
          />
          {isSearching ? <Loader2 className="h-3 w-3 animate-spin text-accent" aria-hidden /> : null}
          {hasSearchActive && !isSearching ? (
            <span className="text-[0.6rem] text-text-muted/80">
              {searchResults ? `${searchResults.length} resultados` : 'Filtrado local'}
            </span>
          ) : null}
        </div>
        {context === 'group' && pinnedMessages.length > 0 ? (
          <div className="flex flex-col gap-2 text-[0.7rem] text-text-muted">
            <span className="inline-flex items-center gap-1 self-start rounded-full bg-accent/20 px-2 py-1 text-accent">
              📌 {pinnedMessages.length} mensajes fijados
            </span>
            <div className="flex flex-wrap gap-2">
              {pinnedMessages.slice(0, 3).map((message) => (
                <button
                  key={`pinned-${message.id}`}
                  type="button"
                  onClick={() => {
                    const element = document.getElementById(`chat-message-${message.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="w-full max-w-xs rounded-2xl border border-accent/30 bg-muted/40 px-3 py-2 text-left text-[0.65rem] text-text transition hover:border-accent"
                >
                  <strong className="block text-xs text-text">@{message.author.username}</strong>
                  <span className="line-clamp-2 text-text-muted">{message.body}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {participants.length > 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-muted/40 bg-muted/20 p-3 text-xs text-text-muted">
          <MessageCircleReply className="h-4 w-4 text-accent" aria-hidden />
          <span className="font-semibold text-text">Participantes</span>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => (
              <Tooltip
                key={participant.id}
                label={
                  participant.isSelf
                    ? 'Este eres tú'
                    : session.isBlocked(participant.username)
                    ? 'Usuario bloqueado'
                    : 'Haz clic para seguir o silenciar'
                }
              >
                <button
                  type="button"
                  onClick={() => {
                    if (participant.isSelf) return;
                    session.toggleFollowUser(participant.username);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    if (participant.isSelf) return;
                    if (session.isBlocked(participant.username)) {
                      session.unblockUser(participant.username);
                    } else {
                      session.blockUser(participant.username);
                    }
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                    participant.isSelf
                      ? 'bg-accent/20 text-accent'
                      : session.isFollowingUser(participant.username)
                      ? 'bg-accent/10 text-accent'
                      : 'bg-muted/40 text-text'
                  )}
                >
                  {participant.avatar ? (
                    <Image
                      src={participant.avatar}
                      alt={participant.username}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : null}
                  @{participant.username}
                  {participant.isMuted ? <span className="text-[0.65rem] text-text-muted">🔇</span> : null}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      ) : null}
      {slowModeSeconds > 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-3 py-1 text-[0.65rem] text-accent">
          ⏱️ Modo lento: 1 mensaje cada {slowModeSeconds}s
        </div>
      ) : null}
      <div
        className="flex-1 space-y-3 overflow-y-auto pr-2"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {visibleMessages.length === 0 ? (
          <p className="text-xs text-text-muted">
            {hasSearchActive ? 'No encontramos mensajes que coincidan con tu búsqueda.' : emptyCopy}
          </p>
        ) : (
          visibleMessages.map((message) => {
            const replyTarget = message.replyToId ? messageMap.get(message.replyToId) : undefined;
            const isSelf = message.author.id === session.username || message.author.isSelf;
            return (
              <div
                key={message.id}
                id={`chat-message-${message.id}`}
                className={cn('flex', isSelf ? 'justify-end' : 'justify-start')}
                onTouchStart={() => handleLongPressStart(message)}
                onTouchEnd={cancelLongPress}
                onTouchCancel={cancelLongPress}
                onMouseLeave={cancelLongPress}
              >
                <div
                  className={cn(
                    'max-w-[80%] space-y-2 rounded-3xl px-4 py-3 text-xs shadow transition',
                    message.system
                      ? 'bg-muted/40 text-text-muted'
                      : isSelf
                      ? 'rounded-br-none bg-accent/15 text-text'
                      : 'rounded-bl-none bg-muted/50 text-text'
                  )}
                >
                  {message.pinned ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-accent">
                      📌 Fijado
                    </span>
                  ) : null}
                  <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-wide text-text-muted">
                    <span className="font-semibold text-text">{message.author.username}</span>
                    <time dateTime={message.createdAt}>{formatRelativeTime(message.createdAt)}</time>
                  </div>
                  {replyTarget ? (
                    <div className="rounded-2xl bg-surface/60 px-3 py-2 text-[0.65rem] text-text-muted">
                      Respondiendo a <strong>@{replyTarget.author.username}</strong>: “{replyTarget.body.slice(0, 80)}”
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap text-sm text-text">{message.body}</p>
                  {!message.system ? (
                    <>
                      <div className="flex flex-wrap items-center justify-end gap-2 text-[0.7rem] text-text-muted">
                        <button
                          type="button"
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                            message.likedByMe ? 'bg-accent/20 text-accent' : 'hover:bg-muted/40'
                          )}
                          onClick={() => toggleLike(message.id)}
                          aria-pressed={message.likedByMe}
                        >
                          <Heart
                            className={cn('h-3.5 w-3.5', message.likedByMe ? 'fill-current text-accent' : undefined)}
                            aria-hidden
                          />
                          {message.likes ?? 0}
                          <span className="sr-only">{message.likedByMe ? 'Quitar like' : 'Dar like'}</span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                          onClick={() => handleReply(message)}
                        >
                          <Reply className="h-3.5 w-3.5" aria-hidden />
                          Responder
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                          onClick={() => togglePin(message.id)}
                        >
                          📌 {message.pinned ? 'Desfijar' : 'Fijar'}
                        </button>
                        <div className="flex items-center gap-1">
                          {reactions.map((emoji) => {
                            const count = message.reactions?.[emoji] ?? 0;
                            const reacted = message.myReactions?.includes(emoji);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                className={cn(
                                  'rounded-full px-2 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                                  reacted ? 'bg-accent/20 text-accent' : 'hover:bg-muted/40'
                                )}
                                onClick={() => toggleReaction(message.id, emoji)}
                                aria-pressed={reacted}
                              >
                                {emoji} {count > 0 ? count : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {message.reactions && Object.keys(message.reactions).length > 0 ? (
                        <div className="flex flex-wrap items-center justify-end gap-1 text-[0.65rem] text-text-muted">
                          {Object.entries(message.reactions).map(([emoji, count]) => (
                            <span
                              key={`${message.id}-${emoji}`}
                              className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1"
                            >
                              {emoji}
                              <span>{count}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {isSelf && message.status ? (
                        <div className="flex items-center justify-end gap-1 text-[0.65rem] text-text-muted">
                          {message.status === 'read' ? (
                            <CheckCheck className="h-3 w-3 text-accent" aria-hidden />
                          ) : message.status === 'delivered' ? (
                            <CheckCheck className="h-3 w-3" aria-hidden />
                          ) : (
                            <Check className="h-3 w-3" aria-hidden />
                          )}
                          <span>
                            {message.status === 'read'
                              ? 'Leído'
                              : message.status === 'delivered'
                              ? 'Entregado'
                              : 'Enviado'}
                          </span>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        {remoteTyping ? (
          <div
            className="flex items-center gap-2 text-xs text-text-muted"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            {context === 'group' ? 'Alguien está escribiendo…' : 'Tu contacto está escribiendo…'}
          </div>
        ) : null}
      </div>
      {replyTo ? (
        <div className="flex items-center justify-between rounded-2xl border border-muted/60 bg-muted/30 px-3 py-2 text-xs text-text">
          <span>
            Respondiendo a <strong>@{replyTo.author.username}</strong>: “{replyTo.body.slice(0, 70)}”
          </span>
          <button type="button" onClick={clearReply} className="inline-flex items-center gap-1 text-text-muted hover:text-text">
            <X className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Cancelar respuesta</span>
          </button>
        </div>
      ) : null}
      <div className="space-y-2 rounded-3xl border border-muted/50 bg-muted/20 p-3">
        <div className="flex items-center justify-between text-[0.65rem] text-text-muted">
          <span>Respeta las reglas · No compartas datos personales</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-accent transition hover:text-accent-2"
              onClick={() => setShowMentions((prev) => !prev)}
            >
              <Smile className="h-3.5 w-3.5" aria-hidden />
              Menciones
            </button>
            {allowDirectTip ? (
              <Tooltip label="Enviar créditos directos">
                <Button size="xs" variant="outline" onClick={handleDirectTip}>
                  <Gift className="mr-1 h-3.5 w-3.5" aria-hidden /> Créditos
                </Button>
              </Tooltip>
            ) : null}
          </div>
        </div>
        {showInlineTopup && needsTopup ? (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 px-3 py-2 text-[0.7rem] text-text">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Pocos créditos: {formatTokens(session.tokenBalance)} · {formatFiat(session.tokenBalance, session.preferredCurrency)}
              </span>
              <span className="text-text-muted">{CREDIT_RATE_NOTE}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickPacks.map((pack) => (
                <Button key={pack.id} size="xs" variant="secondary" onClick={redirectToWallet}>
                  {pack.amount} TKN
                </Button>
              ))}
              <Button size="xs" onClick={redirectToWallet}>
                Recargar
              </Button>
            </div>
          </div>
        ) : null}
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={composerPlaceholder}
          maxLength={240}
          aria-label="Escribe tu mensaje"
        />
        {showMentions ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {participants
              .filter((participant) => !participant.isSelf)
              .map((participant) => (
                <Button
                  key={participant.id}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => handleInsertMention(participant)}
                >
                  @{participant.username}
                </Button>
              ))}
            {participants.filter((participant) => !participant.isSelf).length === 0 ? (
              <span className="text-text-muted">No hay otros participantes todavía.</span>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.65rem] text-text-muted">
            {draft.length}/240 · Límite diario: {formatTokens(tokensLeftToday)} · Mensual: {formatTokens(tokensLeftMonth)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast('Mensaje reportado', {
                  description: 'Gracias por mantener la comunidad segura.'
                })
              }
            >
              Reportar mensaje
            </Button>
            <Button size="sm" onClick={() => void sendMessage()} disabled={!draft.trim()}>
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
    <Dialog open={showTipDialog} onOpenChange={(open) => (!open ? setShowTipDialog(false) : null)}>
      <DialogContent className="max-w-md rounded-3xl border border-muted/60 bg-surface">
        <DialogHeader>
          <DialogTitle>Enviar créditos directos</DialogTitle>
          <DialogDescription>
            Recompensa al creador sin salir del chat. Verás la conversión TKN ⇄ € antes de confirmar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-text-muted">
            Saldo: {formatTokens(session.tokenBalance)} · {formatFiat(session.tokenBalance, session.preferredCurrency)}
          </p>
          <Input
            type="number"
            min={10}
            step={10}
            value={tipAmount}
            onChange={(event) => handleTipAmountChange(event.target.value)}
          />
          <p className="text-xs text-text-muted">
            Este envío equivale a {euroTip}. Te quedan {formatTokens(tokensLeftToday)} hoy y {formatTokens(tokensLeftMonth)} este mes.
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
  </>
  );
}
