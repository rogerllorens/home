'use client';

import { useMemo, useState } from 'react';
import { Share2, Copy, Send, MessageCircle, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { createShareLinks, copyToClipboard, getSiteUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface ShareMenuProps {
  title: string;
  description?: string;
  url?: string;
  hashtags?: string[];
  buttonLabel?: string;
  children?: React.ReactNode;
  onShare?: (channel: 'native' | 'copy' | 'x' | 'telegram' | 'reddit') => void;
}

const CHANNEL_META: Record<'x' | 'telegram' | 'reddit', { label: string; icon: React.ReactNode }> = {
  x: {
    label: 'Compartir en X',
    icon: <Megaphone className="h-4 w-4" aria-hidden />
  },
  telegram: {
    label: 'Enviar a Telegram',
    icon: <Send className="h-4 w-4" aria-hidden />
  },
  reddit: {
    label: 'Publicar en Reddit',
    icon: <MessageCircle className="h-4 w-4" aria-hidden />
  }
};

export function ShareMenu({
  title,
  description,
  url,
  hashtags,
  buttonLabel = 'Compartir',
  children,
  onShare
}: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const shareUrl = url ?? getSiteUrl();

  const links = useMemo(() => createShareLinks({ url: shareUrl, title, description, hashtags }), [
    description,
    hashtags,
    shareUrl,
    title
  ]);

  const triggerShare = () => {
    const payload = { title, text: description ?? title, url: shareUrl };
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share(payload)
        .then(() => {
          onShare?.('native');
          toast.success('Enlace compartido');
        })
        .catch(() => setOpen(true));
    } else {
      setOpen(true);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(shareUrl);
    toast.success('Link copiado');
    onShare?.('copy');
    setOpen(false);
  };

  const renderShareButton = () => (
    <Button type="button" variant="outline" size="sm" onClick={triggerShare} className="gap-2">
      <Share2 className="h-4 w-4" aria-hidden />
      {buttonLabel}
    </Button>
  );

  return (
    <>
      {children ? (
        <button
          type="button"
          onClick={triggerShare}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm text-accent transition hover:text-accent-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          {children}
        </button>
      ) : (
        renderShareButton()
      )}
      <Modal open={open} onOpenChange={setOpen} title="Compartir" description="Lleva a tus contactos a la plataforma de forma segura.">
        <div className="grid gap-3 text-sm">
          <Button asChild variant="outline" className="w-full justify-start gap-3">
            <a
              href={links.x}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                onShare?.('x');
                setOpen(false);
              }}
            >
              {CHANNEL_META.x.icon}
              {CHANNEL_META.x.label}
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start gap-3">
            <a
              href={links.telegram}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                onShare?.('telegram');
                setOpen(false);
              }}
            >
              {CHANNEL_META.telegram.icon}
              {CHANNEL_META.telegram.label}
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start gap-3">
            <a
              href={links.reddit}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                onShare?.('reddit');
                setOpen(false);
              }}
            >
              {CHANNEL_META.reddit.icon}
              {CHANNEL_META.reddit.label}
            </a>
          </Button>
          <Button type="button" variant="ghost" className="w-full justify-start gap-3" onClick={handleCopy}>
            <Copy className="h-4 w-4" aria-hidden /> Copiar link
          </Button>
        </div>
      </Modal>
    </>
  );
}
