'use client';

import { useEffect, useMemo } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Gift,
  Sparkles,
  ShieldAlert,
  MessageCircleHeart,
  AtSign,
  ThumbsUp,
  MessageSquareText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import {
  useSession,
  type NotificationItem,
  type NotificationPreferences
} from '@/components/session-provider';
import { useUiStore } from '@/stores/ui-store';

export function NotificationMenu() {
  const session = useSession();
  const { isNotificationPanelOpen, toggleNotificationPanel } = useUiStore((state) => ({
    isNotificationPanelOpen: state.isNotificationPanelOpen,
    toggleNotificationPanel: state.toggleNotificationPanel
  }));

  useEffect(() => {
    if (isNotificationPanelOpen) {
      session.markNotificationsRead();
    }
  }, [isNotificationPanelOpen, session]);

  const unread = session.unreadNotifications;

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'gift':
        return <Gift className="h-4 w-4" aria-hidden />;
      case 'ppv':
        return <Sparkles className="h-4 w-4" aria-hidden />;
      case 'pass':
        return <CheckCircle2 className="h-4 w-4" aria-hidden />;
      case 'comment':
        return <MessageSquareText className="h-4 w-4" aria-hidden />;
      case 'mention':
        return <AtSign className="h-4 w-4" aria-hidden />;
      case 'like':
        return <ThumbsUp className="h-4 w-4" aria-hidden />;
      case 'forum':
        return <MessageCircleHeart className="h-4 w-4" aria-hidden />;
      case 'referral':
        return <Sparkles className="h-4 w-4 text-accent" aria-hidden />;
      case 'system':
      default:
        return <ShieldAlert className="h-4 w-4" aria-hidden />;
    }
  };

  const preferenceList = useMemo(() => {
    const prefs: { key: keyof NotificationPreferences; label: string }[] = [
      { key: 'gift', label: 'Regalos' },
      { key: 'ppv', label: 'PPV desbloqueados' },
      { key: 'pass', label: 'Pases 30 días' },
      { key: 'comment', label: 'Comentarios' },
      { key: 'mention', label: 'Menciones @' },
      { key: 'like', label: 'Likes' },
      { key: 'forum', label: 'Foro' },
      { key: 'referral', label: 'Referidos' }
    ];
    return prefs;
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={unread > 0 ? `Tienes ${unread} notificaciones` : 'Notificaciones'}
        className="relative"
        onClick={() => toggleNotificationPanel(true)}
      >
        {unread > 0 ? <BellRing className="h-5 w-5 text-accent" /> : <Bell className="h-5 w-5" />}
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent text-[0.6rem] font-semibold text-bg">
            {unread}
          </span>
        ) : null}
      </Button>
      <Drawer open={isNotificationPanelOpen} onOpenChange={(value) => toggleNotificationPanel(value)}>
        <div
          className="h-[75vh] rounded-t-3xl border border-muted/40 bg-surface/95 p-4 backdrop-blur"
          role="region"
          aria-label="Panel de notificaciones"
        >
          <div className="flex flex-col items-start gap-3 border-b border-muted/40 pb-4">
            <h2 className="flex items-center gap-2 text-lg font-heading font-semibold text-text">
              <Bell className="h-5 w-5 text-accent" /> Actividad reciente
            </h2>
            <p className="text-xs text-text-muted">
              Te avisamos cuando desbloquean un PPV, envían gifts, comentan tus posts o compran tu pase. Configura qué avisos
              quieres recibir.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {preferenceList.map((pref) => {
                const enabled = session.notificationPreferences[pref.key];
                return (
                  <Button
                    key={pref.key}
                    variant={enabled ? 'outline' : 'ghost'}
                    size="sm"
                    className="rounded-full"
                    aria-pressed={enabled}
                    onClick={() => session.setNotificationPreference(pref.key, !enabled)}
                  >
                    {pref.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex-1 overflow-y-auto pb-4" aria-live="polite">
            {session.notifications.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-muted/40 bg-muted/20 p-4 text-sm text-text-muted">
                No tienes notificaciones por ahora. Regala un Heart para estrenar la bandeja ✨
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {session.notifications.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-3xl border border-muted/40 bg-muted/30 p-4"
                  >
                    <span
                      className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-accent"
                      aria-hidden
                    >
                      {renderIcon(item.type)}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-text">{item.message}</span>
                      <span className="text-xs text-text-muted">
                        {new Date(item.createdAt).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => toggleNotificationPanel(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
