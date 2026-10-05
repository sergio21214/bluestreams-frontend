'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {

  const [show, setShow] =
    useState(true);

  const [lastScroll, setLastScroll] =
    useState(0);

  const [query, setQuery] =
  useState('');

  const router =
    useRouter();
  
  function handleSearch(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(query)}`
    );
  }

  useEffect(() => {

    const handleScroll = () => {

      const current =
        window.scrollY;

      if (current > lastScroll) {

        setShow(false);

      } else {

        setShow(true);

      }

      setLastScroll(current);
    };

    window.addEventListener(
      'scroll',
      handleScroll
    );

    return () =>
      window.removeEventListener(
        'scroll',
        handleScroll
      );

  }, [lastScroll]);

  return (

    <nav
      className={`
        fixed
        top-0
        left-0
        w-full
        z-50
        transition-all
        duration-300
        px-10
        py-5
        flex
        items-center
        justify-between
        backdrop-blur-md
        bg-black/40
        ${show
          ? 'translate-y-0'
          : '-translate-y-full'
        }
      `}
    >

      <Link
        href="/"
        className="
          text-blue-600
          text-4xl
          font-bold
        "
      >
        BlueStreams
      </Link>

      <div className="
        flex
        items-center
        gap-8
      ">

       <Link href="/">
        Home
      </Link>

      <Link href="/tv">
          Live TV
      </Link>

      <Link href="/movies">
        Movies
      </Link>

      <Link href="/series">
        TV Shows
      </Link>

      <Link href="/music">
        Music
      </Link>


      </div>
      <form
          onSubmit={handleSearch}
          className="
            flex
            items-center
          "
        >
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            className="
              bg-zinc-900/80
              text-white
              px-4
              py-2
              rounded-l-xl
              border
              border-zinc-700
              w-64
            "
          />

          <button
            type="submit"
            className="
              bg-blue-600
              px-4
              py-2
              rounded-r-xl
              hover:bg-blue-500
            "
          >
            🔍
          </button>
        </form>

    </nav>
  );
}