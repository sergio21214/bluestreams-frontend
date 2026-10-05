'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function SeriesPage() {

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const params = useParams();

  const title =
    decodeURIComponent(
      params.title as string
    );

  const [series, setSeries] =
    useState<any>(null);

  const [selectedSeason, setSelectedSeason] =
    useState<number | null>(null);

  useEffect(() => {

    if (!title) {
      return;
    }

    fetch(
      `${API_URL}/media/series/${encodeURIComponent(title)}`
    )
      .then((res) => res.json())
      .then((data) => {

        console.log(
          'SERIES PAYLOAD:',
          data
        );

        setSeries(data);

        if (
          data?.seasons?.length > 0
        ) {

          setSelectedSeason(
            data.seasons[0].seasonNumber
          );

        }

      })
      .catch(console.error);

  }, [title]);

  if (!series) {

    return (
      <>
        <Navbar />

        <main
          className="
            bg-[#050b18]
            text-white
            min-h-screen
            pt-28
            px-10
          "
        >
          Loading...
        </main>
      </>
    );
  }

  const currentSeason =
    series.seasons?.find(
      (season: any) =>
        season.seasonNumber === selectedSeason
    );

  const banner =
    currentSeason?.episodes?.[0];

  const totalEpisodes =
    series.seasons?.reduce(
      (
        total: number,
        season: any
      ) =>
        total +
        (season.episodes?.length || 0),
      0
    ) || 0;

  return (

    <>
      <Navbar />

      <main
        className="
          bg-[#050b18]
          text-white
          min-h-screen
          pt-20
        "
      >

        <section
          className="
            relative
            h-[70vh]
            overflow-hidden
          "
        >

          {banner?.poster && (

            <img
              src={banner.poster}
              alt={series.title}
              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
              "
            />

          )}

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-[#050b18]
              via-[#050b18]/70
              to-transparent
            "
          />

          <div
            className="
              relative
              z-10
              h-full
              flex
              items-end
              px-16
              pb-16
            "
          >

            <div>

              <h1
                className="
                  text-7xl
                  font-bold
                  mb-4
                "
              >
                {series.title}
              </h1>

              <p
                className="
                  text-zinc-300
                  text-xl
                "
              >
                {series.seasons?.length || 0}
                {' '}Seasons •{' '}
                {totalEpisodes}
                {' '}Episodes
              </p>

            </div>

          </div>

        </section>

        <div
          className="
            px-10
            py-10
          "
        >

          <div className="mb-8">

            <select
              value={
                selectedSeason ?? ''
              }
              onChange={(e) =>
                setSelectedSeason(
                  Number(e.target.value)
                )
              }
              className="
                bg-slate-900
                border
                border-slate-700
                text-white
                px-5
                py-3
                rounded-xl
                outline-none
              "
            >

              {series.seasons?.map(
                (season: any) => (

                  <option
                    key={
                      season.seasonNumber
                    }
                    value={
                      season.seasonNumber
                    }
                  >

                    {
                      season.seasonNumber === 0
                        ? 'Unidentified'
                        : `Season ${season.seasonNumber}`
                    }

                  </option>

                )
              )}

            </select>

          </div>

          <div
            className="
              space-y-5
            "
          >

            {currentSeason?.episodes?.map(
              (episode: any) => (

                <a
                  key={episode.id}
                  href={`/watch/${episode.id}`}
                  className="
                    flex
                    gap-5
                    bg-slate-900
                    p-4
                    rounded-2xl
                    hover:bg-slate-800
                    hover:scale-[1.01]
                    transition-all
                  "
                >

                  <img
                    src={episode.poster}
                    alt={episode.title}
                    className="
                      w-64
                      h-36
                      object-cover
                      rounded-xl
                      shrink-0
                    "
                  />

                  <div
                    className="
                      flex
                      flex-col
                      justify-center
                    "
                  >

                    <h2
                      className="
                        text-2xl
                        font-bold
                      "
                    >

                      {
                        episode.episodeNumber
                          ? `Episode ${episode.episodeNumber}`
                          : 'Episode'
                      }

                    </h2>

                    <p
                      className="
                        text-white
                        mt-2
                        text-lg
                      "
                    >
                      {episode.title}
                    </p>

                    <div
                      className="
                        mt-4
                        inline-flex
                        items-center
                        gap-2
                        text-blue-400
                        font-semibold
                      "
                    >
                      ▶ Watch Episode
                    </div>

                  </div>

                </a>

              )
            )}

          </div>

        </div>

      </main>
    </>
  );
}