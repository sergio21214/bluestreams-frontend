'use client';

import Link from 'next/link';
import { useState } from 'react';

import { getProgressPercent } from '@/lib/progress';
import type { MediaItem } from '@/lib/types';

import VideoPreview from './VideoPreview';

export default function MediaCard({
  item
}: {
  item: MediaItem;
}) {
  const [hovered, setHovered] = useState(false);
  const [progress] = useState(() => getProgressPercent(item.id));

  const poster =
    item.poster && item.poster !== 'N/A'
      ? item.poster
      : item.thumbnailUrl;

  const preview = item.previewUrl || item.manifestUrl;

  return (
    <div
      className="
        group
        relative
        w-[240px]
        min-w-[240px]
        transition
        duration-300
        hover:z-30
      "
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-white/5
          bg-white/[0.03]
          shadow-xl
          shadow-black/30
          transition
          duration-300
          group-hover:scale-[1.04]
          group-hover:border-blue-500/30
        "
      >

        <Link
          href={`/title/${item.id}`}
          className="relative block h-[150px] bg-black"
        >

          {!hovered || !preview ? (
            poster && poster !== 'N/A' ? (
              <img
                src={poster}
                alt={item.title ?? 'Media'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900/50 to-slate-900 text-3xl text-blue-300/50">
                ▶
              </div>
            )
          ) : (
            <VideoPreview
              src={preview}
              className="h-full w-full object-cover"
            />
          )}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-t
              from-black/60
              via-transparent
              to-transparent
              opacity-0
              transition
              group-hover:opacity-100
            "
          />

        </Link>

        {progress > 0 && progress < 100 && (
          <div className="h-1 w-full bg-white/10">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4">

          <Link href={`/title/${item.id}`}>

            <h3 className="truncate text-base font-bold text-white transition hover:text-blue-400">
              {item.title ?? item.name ?? 'Untitled'}
            </h3>

          </Link>

          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">

            {item.year && <span>{item.year}</span>}

            {item.genre && (
              <>
                <span>•</span>
                <span className="truncate">{item.genre}</span>
              </>
            )}

          </div>

          <div
            className={`
              mt-4
              flex
              gap-2
              transition
              ${
                hovered
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-1 opacity-0'
              }
            `}
          >

            <Link
              href={`/watch/${item.id}`}
              className="
                rounded-lg
                bg-blue-600
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-500
              "
            >
              ▶ Play
            </Link>

            <Link
              href={`/title/${item.id}`}
              className="
                rounded-lg
                bg-white/10
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-white/20
              "
            >
              Details
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}
