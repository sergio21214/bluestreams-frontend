'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

import type { VodSubtitleTrack } from '@/lib/iptv';

type AudioTrack = {
  name?: string;
  lang?: string;
};

function languageName(language?: string | null): string {
  if (!language || language === 'und') {
    return '';
  }

  try {
    return (
      new Intl.DisplayNames(['en'], { type: 'language' }).of(
        language
      ) ?? language
    );
  } catch {
    return language;
  }
}

export default function HlsPlayer({
  src,
  isHls,
  title,
  subtitle,
  subtitles = []
}: {
  src: string | null;
  isHls: boolean;
  title?: string;
  subtitle?: string;
  subtitles?: VodSubtitleTrack[];
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [error, setError] = useState('');

  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>(
    []
  );

  const [audioIndex, setAudioIndex] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    const video = videoRef.current;

    setAudioTracks([]);
    setAudioIndex(0);
    setSubtitleIndex(null);
    setError('');

    if (!video || !src) {
      return;
    }

    let hls: Hls | null = null;

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false
        });

        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const tracks = (hls?.audioTracks ?? []) as AudioTrack[];

          setAudioTracks(tracks);
          setAudioIndex(hls?.audioTrack ?? 0);

          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setError(
              'Playback failed. The stream may be offline or the format is not supported.'
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
      hlsRef.current = null;

      if (hls) {
        hls.destroy();
      }

      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src, isHls]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    Array.from(video.textTracks).forEach((track, index) => {
      track.mode = index === 0 ? 'showing' : 'disabled';
    });
  }, [subtitleIndex, subtitles, src]);

  function changeAudio(value: number) {
    setAudioIndex(value);

    if (hlsRef.current) {
      hlsRef.current.audioTrack = value;
    }
  }

  const activeSubtitle =
    subtitleIndex !== null ? subtitles[subtitleIndex] : null;

  const hasControls =
    audioTracks.length > 1 || subtitles.length > 0;

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
                'This stream could not be played. The format may not be supported by the browser.'
              )
            }
            className="h-full w-full object-contain"
          >
            {activeSubtitle && (
              <track
                key={activeSubtitle.url}
                kind="subtitles"
                src={activeSubtitle.url}
                srcLang={activeSubtitle.language || 'und'}
                label={activeSubtitle.label}
                default
              />
            )}
          </video>
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

      {hasControls && src && (
        <div className="flex flex-wrap items-center gap-4 border-t border-white/10 px-4 py-3">

          {audioTracks.length > 1 && (
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Audio</span>

              <select
                value={audioIndex}
                onChange={(event) =>
                  changeAudio(Number(event.target.value))
                }
                className="
                  rounded-lg
                  border
                  border-white/10
                  bg-[#0d1728]
                  px-2
                  py-1.5
                  text-xs
                  text-white
                  outline-none
                "
              >
                {audioTracks.map((track, index) => (
                  <option key={index} value={index}>
                    {languageName(track.lang) ||
                      track.name ||
                      `Audio ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )}

          {subtitles.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Subtitles</span>

              <select
                value={subtitleIndex ?? -1}
                onChange={(event) =>
                  setSubtitleIndex(
                    Number(event.target.value) < 0
                      ? null
                      : Number(event.target.value)
                  )
                }
                className="
                  rounded-lg
                  border
                  border-white/10
                  bg-[#0d1728]
                  px-2
                  py-1.5
                  text-xs
                  text-white
                  outline-none
                "
              >
                <option value={-1}>Off</option>

                {subtitles.map((track, index) => (
                  <option key={track.url} value={index}>
                    {track.label ||
                      languageName(track.language) ||
                      `Subtitle ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )}

        </div>
      )}

      {error && (
        <p className="border-t border-white/10 px-4 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

    </div>
  );
}
