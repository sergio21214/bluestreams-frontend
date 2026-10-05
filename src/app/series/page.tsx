'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function SeriesPage() {

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const [series, setSeries] =
    useState<any[]>([]);

  useEffect(() => {

    fetch(
      `${API_URL}/media/series`
    )
      .then(res => res.json())
      .then(data => {

        const uniqueSeries =
          Array.from(
            new Map(
              data
                .filter(
                  (item: any) =>
                    item.seriesTitle
                )
                .map(
                  (item: any) => [
                    item.seriesTitle,
                    item
                  ]
                )
            ).values()
          );

        setSeries(uniqueSeries);

      });

  }, []);

  return (

    <>
      <Navbar />

      <main className="
        min-h-screen
        bg-[#050b18]
        text-white
        pt-28
        px-10
      ">

        <h1 className="
          text-5xl
          font-bold
          mb-10
        ">
          TV Shows
        </h1>

        <div className="
          grid
          grid-cols-5
          gap-6
        ">

          {series.map(item => (

            <Link
              key={item.seriesTitle}
              href={`/series/${encodeURIComponent(item.seriesTitle)}`}
            >

              <div className="
                bg-slate-900
                rounded-xl
                overflow-hidden
                hover:scale-105
                transition
              ">

                <img
                  src={item.poster}
                  alt={item.seriesTitle}
                  className="
                    w-full
                    h-72
                    object-cover
                  "
                />

                <div className="p-4">

                  <h2 className="
                    font-semibold
                    text-lg
                  ">
                    {item.seriesTitle}
                  </h2>

                </div>

              </div>

            </Link>

          ))}

        </div>

      </main>
    </>
  );
}