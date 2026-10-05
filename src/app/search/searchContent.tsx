'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SearchContent() {

  const params = useSearchParams();

  const query =
    params.get('q') || '';

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const [results, setResults] =
    useState<any[]>([]);

  useEffect(() => {

    if (!query) return;

    fetch(
      `${API_URL}/media/search?q=${encodeURIComponent(query)}`
    )
      .then(res => res.json())
      .then(data => setResults(data));

  }, [query]);

  return (

    <main className="pt-28 px-10 text-white bg-black min-h-screen">

      <h1 className="text-3xl font-bold mb-8">
        Search: {query}
      </h1>

      <div className="grid grid-cols-5 gap-6">

        {results.map(item => (

          <div
            key={item.id}
            className="
              bg-zinc-900
              rounded-xl
              overflow-hidden
            "
          >

            <img
              src={item.poster}
              alt={item.title}
              className="
                w-full
                h-72
                object-cover
              "
            />

            <div className="p-4">

              <h2 className="font-semibold">
                {item.title}
              </h2>

              <p className="text-zinc-400 text-sm">
                {item.mediaType}
              </p>

            </div>

          </div>

        ))}

      </div>

    </main>
  );
}