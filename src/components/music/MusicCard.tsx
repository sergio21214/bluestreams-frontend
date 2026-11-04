'use client';

import { useState } from 'react';

type MusicCardProps = {
  image?: string | null;
  title: string;
  subtitle?: string | null;
  round?: boolean;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
  onPlay?: () => void;
};

export default function MusicCard({
  image,
  title,
  subtitle,
  round = false,
  badge,
  active = false,
  onClick,
  onPlay
}: MusicCardProps) {
  const [broken, setBroken] = useState(false);

  const activeClasses = active
    ? 'bg-blue-500/10 ring-1 ring-blue-500/50'
    : 'bg-white/[0.03] hover:bg-white/[0.07]';

  const content = (
    <div
      className={`
        group
        relative
        w-40
        shrink-0
        cursor-pointer
        rounded-2xl
        p-3
        transition
        duration-300
        ${activeClasses}
        sm:w-44
      `}
    >

      <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-zinc-900">

        {image && !broken ? (
          <img
            src={image}
            alt={title}
            onError={() => setBroken(true)}
            className={`
              h-full
              w-full
              object-cover
              transition
              duration-500
              group-hover:scale-105
              ${round ? 'rounded-full' : ''}
            `}
          />
        ) : (
          <div
            className={`
              flex
              h-full
              w-full
              items-center
              justify-center
              bg-gradient-to-br
              from-blue-900/60
              to-slate-900
              text-3xl
              text-blue-300/60
              ${round ? 'rounded-full' : ''}
            `}
          >
            ♪
          </div>
        )}

        {badge && (
          <span
            className="
              absolute
              left-2
              top-2
              rounded-full
              bg-black/60
              px-2
              py-0.5
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-blue-300
              backdrop-blur
            "
          >
            {badge}
          </span>
        )}

        {onPlay && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPlay();
            }}
            aria-label={`Play ${title}`}
            className="
              absolute
              bottom-2
              right-2
              flex
              h-10
              w-10
              translate-y-2
              items-center
              justify-center
              rounded-full
              bg-blue-600
              text-white
              opacity-0
              shadow-xl
              shadow-blue-900/50
              transition
              duration-200
              hover:scale-105
              hover:bg-blue-500
              group-hover:translate-y-0
              group-hover:opacity-100
            "
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-0.5 h-4 w-4"
            >
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </button>
        )}

      </div>

      <p className="truncate text-sm font-semibold text-white">
        {title}
      </p>

      {subtitle && (
        <p className="mt-1 truncate text-xs text-zinc-400">
          {subtitle}
        </p>
      )}

    </div>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left"
    >
      {content}
    </button>
  );
}
