'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';

type MediaType = 'image' | 'video';

interface MediaPlayerProps {
  id: string;
  type: MediaType;
  placeholder: string;
  visibility: 'free' | 'ppv' | 'pass_only';
  secureUrl?: string;
  onRefresh?: (id: string) => Promise<string>;
}

export function MediaPlayer({ id, type, placeholder, visibility, secureUrl, onRefresh }: MediaPlayerProps) {
  const [url, setUrl] = useState(secureUrl);
  const [loading, setLoading] = useState(!secureUrl && visibility !== 'free');

  useEffect(() => {
    let active = true;
    if (!secureUrl && visibility !== 'free' && onRefresh) {
      setLoading(true);
      onRefresh(id)
        .then((fresh) => {
          if (active) setUrl(fresh);
        })
        .finally(() => active && setLoading(false));
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [id, visibility, secureUrl, onRefresh]);

  if (loading) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-muted/60 bg-muted/40">
        <Spinner />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-muted/60">
        <Image src={placeholder} alt="Media bloqueado" fill className="object-cover" />
      </div>
    );
  }

  if (type === 'video') {
    return (
      <video controls className="aspect-video w-full overflow-hidden rounded-2xl" src={url} />
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-muted/60">
      <Image src={url} alt="Media" fill className="object-cover" />
    </div>
  );
}
