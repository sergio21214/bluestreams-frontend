'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function TitlePage() {

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const params =
    useParams();

  const id =
    params.id;

  const [media, setMedia] =
    useState<any>(null);

  const [episodes, setEpisodes] =
    useState<any[]>([]);

  useEffect(() => {

    fetch(
      `${API_URL}/media/${id}`
    )
      .then((res) => res.json())
      .then((data) => {

        setMedia(data);

      })
      .catch(console.error);

    fetch(
      `${API_URL}/media/${id}/episodes`
    )
      .then((res) => res.json())
      .then((data) => {

        if (Array.isArray(data)) {

          setEpisodes(data);

        }

      })
      .catch(console.error);

  }, [id]);

  if (!media) {

    return (

      <main className="
        min-h-screen
        bg-black
        text-white
        flex
        items-center
        justify-center
      ">
        Loading...
      </main>

    );
  }

  const backdrop =
    media.poster !== 'N/A'
      ? media.poster
      : media.thumbnailUrl;

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
    ">

      {/* HERO */}

      <div
        className="
          relative
          h-[700px]
          bg-cover
          bg-center
          flex
          items-end
        "
        style={{
          backgroundImage:
            `url(${backdrop})`
        }}
      >

        <div className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black
          via-black/40
          to-transparent
        " />

        <div className="
          relative
          z-10
          p-16
          max-w-3xl
        ">

          <h1 className="
            text-6xl
            font-bold
            mb-6
          ">
            {media.seriesTitle || media.title}
          </h1>

          <div className="
            flex
            gap-4
            text-zinc-300
            mb-6
          ">

            {media.year && (
              <span>{media.year}</span>
            )}

            {media.genre && (
              <span>{media.genre}</span>
            )}

            {media.mediaType && (
              <span className="
                uppercase
                text-red-500
                font-semibold
              ">
                {media.mediaType}
              </span>
            )}

          </div>

          <p className="
            text-lg
            text-zinc-200
            leading-relaxed
            mb-8
          ">
            {media.overview}
          </p>

          {/* MOVIE PLAY BUTTON */}

          {media.mediaType === 'movie' && (

            <a
              href={`/watch/${media.id}`}
              className="
                inline-flex
                items-center
                gap-3
                bg-white
                text-black
                px-8
                py-4
                rounded-xl
                font-bold
                hover:bg-zinc-300
                transition
              "
            >
              ▶ Play
            </a>

          )}

        </div>

      </div>

      {/* SERIES EPISODES */}

      {episodes.length > 0 && (

        <div className="p-12">

          <h2 className="
            text-4xl
            font-bold
            mb-8
          ">
            Episodes
          </h2>

          <div className="
            flex
            flex-col
            gap-6
          ">

            {episodes.map((episode) => (

              <a
                key={episode.id}
                href={`/watch/${episode.id}`}
                className="
                  flex
                  gap-6
                  bg-zinc-900
                  rounded-2xl
                  overflow-hidden
                  hover:bg-zinc-800
                  transition
                "
              >

                <img
                  src={
                    episode.poster !== 'N/A'
                      ? episode.poster
                      : episode.thumbnailUrl
                  }
                  alt={episode.title}
                  className="
                    w-[320px]
                    h-[180px]
                    object-cover
                  "
                />

                <div className="
                  p-6
                  flex-1
                ">

                  <div className="
                    flex
                    items-center
                    gap-4
                    mb-4
                  ">

                    <span className="
                      text-red-500
                      font-bold
                    ">
                      S{episode.seasonNumber}
                      E{episode.episodeNumber}
                    </span>

                    <h3 className="
                      text-2xl
                      font-semibold
                    ">
                      {episode.title}
                    </h3>

                  </div>

                  <p className="
                    text-zinc-400
                    line-clamp-3
                  ">
                    {episode.overview}
                  </p>

                </div>

              </a>

            ))}

          </div>

        </div>

      )}

    </main>
  );
}