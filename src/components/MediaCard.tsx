'use client';

import {
  useRef,
  useState
} from 'react';

export default function MediaCard({
  item
}: {
  item: any;
}) {

  const [hovered, setHovered] =
    useState(false);

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const poster =
    item.poster &&
    item.poster !== 'N/A'
      ? item.poster
      : item.thumbnailUrl;

  // PROGRESS

  const progressRaw =
    typeof window !== 'undefined'
      ? localStorage.getItem(
          `progress-${item.id}`
        )
      : null;

  let progressPercent = 0;

  if (progressRaw) {

    try {

      const parsed =
        JSON.parse(progressRaw);

      progressPercent =
        (
          parsed.currentTime /
          parsed.duration
        ) * 100;

    } catch {}

  }

  return (

    <div
      className="
        relative
        min-w-[260px]
        w-[260px]
        transition-all
        duration-300
        hover:z-50
      "
      onMouseEnter={() => {

        setHovered(true);

        setTimeout(() => {

          if (
            videoRef.current
          ) {

            videoRef.current.play()
              .catch(() => {});

          }

        }, 500);

      }}
      onMouseLeave={() => {

        setHovered(false);

        if (
          videoRef.current
        ) {

          videoRef.current.pause();

          videoRef.current.currentTime = 0;

        }

      }}
    >

      <div
        className={`
          bg-zinc-900
          rounded-2xl
          overflow-hidden
          shadow-2xl
          transition-all
          duration-300
          ${
            hovered
              ? 'scale-110'
              : 'scale-100'
          }
        `}
      >

        {/* IMAGE / VIDEO */}

        <a href={`/title/${item.id}`}>

          <div className="
            relative
            h-[150px]
            bg-black
          ">

            {!hovered && (

              <img
                src={poster}
                alt={item.title}
                className="
                  w-full
                  h-full
                  object-cover
                "
              />

            )}

            {hovered && (

              <video
                ref={videoRef}
                muted
                loop
                playsInline
                className="
                  w-full
                  h-full
                  object-cover
                "
              >

                <source
                  src={
                    item.previewUrl ||
                    item.manifestUrl
                  }
                />

              </video>

            )}

          </div>

        </a>

        {/* PROGRESS BAR */}

        {progressPercent > 0 && (

          <div className="
            h-1
            bg-zinc-800
            w-full
          ">

            <div
              className="
                h-full
                bg-blue-600 hover:bg-blue-500
              "
              style={{
                width:
                  `${progressPercent}%`
              }}
            />

          </div>

        )}

        {/* INFO */}

        <div className="p-4">

          <a href={`/title/${item.id}`}>

            <h3 className="
              font-bold
              text-base
              line-clamp-1
              hover:text-red-500
            ">
              {item.title}
            </h3>

          </a>

          <div className="
            flex
            items-center
            gap-2
            mt-2
            text-sm
            text-zinc-400
          ">

            {item.year && (

              <span>
                {item.year}
              </span>

            )}

            {item.genre && (

              <>

                <span>•</span>

                <span className="
                  line-clamp-1
                ">
                  {item.genre}
                </span>

              </>

            )}

          </div>

          {hovered && (

            <div className="
              flex
              gap-2
              mt-4
            ">

              <a
                href={`/watch/${item.id}`}
                className="
                  bg-white
                  text-black
                  px-4
                  py-2
                  rounded-lg
                  font-semibold
                  text-sm
                  hover:bg-zinc-300
                "
              >
                ▶ Play
              </a>

              <a
                href={`/title/${item.id}`}
                className="
                  bg-zinc-700
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                  hover:bg-zinc-600
                "
              >
                Details
              </a>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}