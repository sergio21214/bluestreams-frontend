'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import MediaCard from '@/components/MediaCard';

export default function MoviesPage() {

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const [movies, setMovies] =
    useState<any[]>([]);

  useEffect(() => {

    fetch(
      `${API_URL}/media/movies`
    )
      .then((res) => res.json())
      .then(setMovies)
      .catch(console.error);

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
          Movies
        </h1>

        <div className="
          grid
          grid-cols-6
          gap-6
        ">

          {movies.map(movie => (

            <MediaCard
              key={movie.id}
              item={movie}
            />

          ))}

        </div>

      </main>
    </>

  );
}