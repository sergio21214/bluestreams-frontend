'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({
  src,
  isHls,
  title,
  subtitle
}: {
  src: string | null;
  isHls: boolean;
  title?: string;
  subtitle?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [error, setError] = useState('');

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !src) {
      return;
    }

    setError('');

    let hls: Hls | null = null;

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setError(
              'Playback failed. The stream may be offline or blocked by the browser.'
            );
          }
        });
      } else if (
        video.canPlayType('application/vnd.apple.mpegurl')
      ) {
        video.src = src;
        video.play().catch(() => {});
      } else {
        setError('HLS is not supported by this browser.');
      }
    } else {
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      if (hls) {
        hls.destroy();
      }

      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src, isHls]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60">

      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {title || 'Nothing playing'}
          </p>

          {subtitle && (
            <p className="truncate text-xs text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>

        {src && (
          <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-300">
            {isHls ? 'Live' : 'VOD'}
          </span>
        )}

      </div>

      <div className="relative aspect-video bg-black">

        {src ? (
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            onError={() =>
              setError(
                'This stream could not be played. The format may not be supported by the browser or the provider may block HTTPS playback.'
              )
            }
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-10 w-10"
            >
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M8 3l4 4 4-4" />
            </svg>
            <p className="text-sm">Choose something to watch</p>
          </div>
        )}

      </div>

      {error && (
        <p className="border-t border-white/10 px-4 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

    </div>
  );
}
