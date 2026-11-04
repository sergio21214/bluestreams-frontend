'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

type ShakaPlayerInstance = {
  attach: (media: HTMLMediaElement) => Promise<void>;
  load: (url: string) => Promise<void>;
  destroy: () => void | Promise<void>;
};

type ShakaNamespace = {
  polyfill: { installAll: () => void };
  Player: {
    new (): ShakaPlayerInstance;
    isBrowserSupported: () => boolean;
  };
};

export default function VideoPreview({
  src,
  className
}: {
  src?: string | null;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !src) {
      return;
    }

    let hls: Hls | null = null;
    let player: ShakaPlayerInstance | null = null;
    let cancelled = false;

    const play = () => {
      video.play().catch(() => {
        // Autoplay with audio disabled can still be blocked; ignore.
      });
    };

    async function setup() {
      if (/\.m3u8(\?.*)?$/i.test(src!)) {
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true });
          hls.loadSource(src!);
          hls.attachMedia(video!);
          hls.on(Hls.Events.MANIFEST_PARSED, play);
          return;
        }

        if (video!.canPlayType('application/vnd.apple.mpegurl')) {
          video!.src = src!;
          play();
          return;
        }
      }

      if (/\.mpd(\?.*)?$/i.test(src!)) {
        try {
          const shakaModule = await import(
            'shaka-player/dist/shaka-player.ui.js'
          );

          const shaka = (
            (shakaModule as unknown as { default?: ShakaNamespace })
              .default ?? shakaModule
          ) as unknown as ShakaNamespace;

          shaka.polyfill.installAll();

          if (!shaka.Player.isBrowserSupported()) {
            return;
          }

          player = new shaka.Player();

          await player.attach(video!);

          if (cancelled) {
            return;
          }

          await player.load(src!);
          play();
          return;
        } catch (error) {
          console.error('Preview failed', error);
          return;
        }
      }

      video!.src = src!;
      play();
    }

    setup();

    return () => {
      cancelled = true;

      if (hls) {
        hls.destroy();
      }

      if (player) {
        Promise.resolve(player.destroy()).catch(() => {});
      }

      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      className={className}
    />
  );
}
