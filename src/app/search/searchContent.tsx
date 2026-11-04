'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import MediaCard from '@/components/MediaCard';
import Navbar from '@/components/Navbar';
import type { MediaItem } from '@/lib/types';

export default function SearchContent() {
  const params = useSearchParams();

  const query = params.get('q') || '';

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    let cancelled = false;

    setLoading(true);

    fetch(`${API_URL}/media/search?q=${encodeURIComponent(query)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((data: MediaItem[]) => {
        if (!cancelled) {
          setResults(data);
        }
      })
      .catch((error) => {
        console.error('Search failed', error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, API_URL]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#050b18] px-4 pt-28 text-white sm:px-6 lg:px-10">

        <div className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400/80">
            Search
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            {query ? `Results for "${query}"` : 'Search your library'}
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            {loading
              ? 'Searching...'
              : `${results.length} result${
                  results.length === 1 ? '' : 's'
                }`}
          </p>

        </div>

        {!loading && results.length === 0 && query && (
          <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center text-sm text-zinc-500">
            Nothing found. Try a different title.
          </p>
        )}

        <div className="flex flex-wrap gap-5 pb-16">
          {results.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>

      </main>
    </>
  );
}
