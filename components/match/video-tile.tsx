'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { attachStream } from '@/lib/rtc';

interface VideoTileProps {
  label: string;
  stream?: MediaStream | null;
  placeholder?: React.ReactNode;
  isLocal?: boolean;
  isSpeaking?: boolean;
  muted?: boolean;
  isBlurred?: boolean;
  children?: React.ReactNode;
}

export function VideoTile({
  label,
  stream,
  placeholder,
  isLocal = false,
  isSpeaking,
  muted,
  isBlurred,
  children
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    attachStream(videoRef.current, stream ?? null);
  }, [stream]);

  return (
    <div
      className={cn(
        'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-3xl border border-muted/60 bg-black/60 shadow-lg',
        isSpeaking && 'ring-4 ring-accent'
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || muted}
        className={cn(
          'h-full w-full object-cover transition-all duration-700',
          !stream && 'hidden',
          isBlurred && 'scale-105 blur-xl'
        )}
      />
      {!stream ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-text-muted">
          {placeholder ?? <span>{label}</span>}
        </div>
      ) : null}
      {isBlurred ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/40 to-black/70 text-sm font-semibold text-text">
          Revelando cámara…
        </div>
      ) : null}
      <div className="absolute bottom-3 left-3 rounded-full bg-surface/80 px-3 py-1 text-xs font-semibold text-text shadow">
        {label}
      </div>
      {children}
    </div>
  );
}
