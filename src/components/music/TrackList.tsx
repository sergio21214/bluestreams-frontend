'use client';

import { useAudioPlayer } from '@/app/context/AudioPlayerContext';
import type { MusicTrack } from '@/lib/types';

function formatDuration(durationMs?: number | null): string {
  if (!durationMs || durationMs <= 0) {
    return '';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function Equalizer() {
  return (
    <span className="flex h-4 items-end justify-center gap-0.5">
      <span className="h-2 w-0.5 animate-pulse rounded-full bg-blue-400" />
      <span className="h-4 w-0.5 animate-pulse rounded-full bg-blue-400 [animation-delay:150ms]" />
      <span className="h-3 w-0.5 animate-pulse rounded-full bg-blue-400 [animation-delay:300ms]" />
    </span>
  );
}

export default function TrackList({
  tracks,
  title,
  subtitle,
  showHeader = false,
  showAlbum = true,
  showPlayCount = false,
  emptyText = 'Nothing here yet.'
}: {
  tracks: MusicTrack[];
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showAlbum?: boolean;
  showPlayCount?: boolean;
  emptyText?: string;
}) {
  const { currentTrack, playTrack } = useAudioPlayer();

  function playAll() {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  }

  return (
    <section>

      {showHeader && (
        <div className="mb-4 flex items-end justify-between gap-4">

          <div>
            {title && (
              <h2 className="text-xl font-bold text-white">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-1 text-sm text-zinc-400">
                {subtitle}
              </p>
            )}
          </div>

          {tracks.length > 0 && (
            <button
              type="button"
              onClick={playAll}
              className="
                shrink-0
                rounded-full
                bg-blue-600
                px-4
                py-2
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-blue-500
              "
            >
              ▶ Play all
            </button>
          )}

        </div>
      )}

      {tracks.length === 0 ? (
        <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center text-sm text-zinc-500">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-1">

          {tracks.map((track, index) => {
            const active = currentTrack?.id === track.id;

            return (
              <button
                type="button"
                key={`${track.id}-${index}`}
                onClick={() => playTrack(track, tracks)}
                className={`
                  group
                  grid
                  w-full
                  grid-cols-[28px_minmax(0,1fr)_auto]
                  items-center
                  gap-3
                  rounded-xl
                  px-2
                  py-2
                  text-left
                  transition
                  ${
                    active
                      ? 'bg-blue-500/10'
                      : 'hover:bg-white/5'
                  }
                `}
              >

                <span className="text-center text-xs text-zinc-500">

                  <span className={active ? 'hidden' : 'group-hover:hidden'}>
                    {index + 1}
                  </span>

                  <span className={active ? 'block' : 'hidden group-hover:block'}>
                    {active ? (
                      <Equalizer />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="mx-auto h-3.5 w-3.5 text-white"
                      >
                        <path d="M8 5v14l11-7L8 5z" />
                      </svg>
                    )}
                  </span>

                </span>

                <span className="flex min-w-0 items-center gap-3">

                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-900">

                    {track.poster ? (
                      <img
                        src={track.poster}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-blue-300/60">
                        ♪
                      </span>
                    )}

                  </span>

                  <span className="min-w-0">

                    <span
                      className={`
                        block
                        truncate
                        text-sm
                        font-medium
                        ${active ? 'text-blue-300' : 'text-white'}
                      `}
                    >
                      {track.title}
                    </span>

                    <span className="block truncate text-xs text-zinc-400">
                      {track.artist || 'Unknown artist'}

                      {showAlbum && track.album && (
                        <> • {track.album}</>
                      )}
                    </span>

                  </span>

                </span>

                <span className="flex items-center gap-4 pr-2 text-xs text-zinc-500">

                  {showPlayCount && (
                    <span className="hidden sm:inline">
                      {track.playCount ?? 0} plays
                    </span>
                  )}

                  <span className="tabular-nums">
                    {formatDuration(track.durationMs)}
                  </span>

                </span>

              </button>
            );
          })}

        </div>
      )}

    </section>
  );
}
