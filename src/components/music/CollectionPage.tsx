'use client';

import { useEffect, useState } from 'react';

import { useAudioPlayer } from '@/app/context/AudioPlayerContext';
import { getProfileId, getToken } from '@/lib/auth';
import type { MusicTrack } from '@/lib/types';

import MusicShell from './MusicShell';
import TrackList from './TrackList';

export default function CollectionPage({
  title,
  subtitle,
  endpoint,
  gradient,
  icon,
  showPlayCount = false,
  emptyText
}: {
  title: string;
  subtitle: string;
  endpoint: string;
  gradient: string;
  icon: React.ReactNode;
  showPlayCount?: boolean;
  emptyText?: string;
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const { playTrack } = useAudioPlayer();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = getToken();
      const profileId = getProfileId();

      if (!token || !profileId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Profile-Id': profileId
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as MusicTrack[];

        if (cancelled) {
          return;
        }

        setTracks(
          data.map((track) => ({
            ...track,
            id: Number(track.id ?? track.mediaId)
          }))
        );
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError('Could not load this collection.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [API_URL, endpoint]);

  function playAll() {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  }

  return (
    <MusicShell>

      <div className="p-4 pb-16 sm:p-6 lg:p-10">

        <header
          className={`
            relative
            overflow-hidden
            rounded-3xl
            bg-gradient-to-br
            ${gradient}
            p-6
            sm:p-8
            lg:p-10
          `}
        >

          <div
            className="
              absolute
              -right-16
              -top-20
              h-64
              w-64
              rounded-full
              bg-white/10
              blur-3xl
            "
          />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end">

            <div
              className="
                flex
                h-28
                w-28
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-black/25
                text-blue-200
                shadow-2xl
                backdrop-blur
              "
            >
              {icon}
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200/80">
                Collection
              </p>

              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                {title}
              </h1>

              <p className="mt-3 max-w-xl text-sm text-blue-100/70">
                {subtitle}
              </p>

              <p className="mt-2 text-xs text-blue-100/60">
                {loading
                  ? 'Loading songs...'
                  : `${tracks.length} song${tracks.length === 1 ? '' : 's'}`}
              </p>

            </div>

            <button
              type="button"
              onClick={playAll}
              disabled={tracks.length === 0}
              className="
                flex
                items-center
                gap-2
                self-start
                rounded-full
                bg-white
                px-6
                py-3
                text-sm
                font-bold
                text-black
                shadow-xl
                transition
                hover:scale-105
                hover:bg-blue-50
                disabled:cursor-not-allowed
                disabled:opacity-40
                sm:self-end
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
              Play all
            </button>

          </div>

        </header>

        <div className="mt-8">

          {error && (
            <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
            </div>
          ) : (
            <TrackList
              tracks={tracks}
              showPlayCount={showPlayCount}
              emptyText={emptyText}
            />
          )}

        </div>

      </div>

    </MusicShell>
  );
}
