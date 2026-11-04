'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAudioPlayer } from '@/app/context/AudioPlayerContext';
import MusicCard from '@/components/music/MusicCard';
import MusicShell from '@/components/music/MusicShell';
import TrackList from '@/components/music/TrackList';
import { getProfileId, getToken } from '@/lib/auth';
import type {
  MusicAlbum,
  MusicArtist,
  MusicHome,
  MusicLibrary,
  MusicTrack
} from '@/lib/types';

function normalizeTrack(track: MusicTrack): MusicTrack {
  return {
    ...track,
    id: Number(track.id ?? track.mediaId)
  };
}

function artistArtwork(artist: MusicArtist): string | null {
  return (
    artist.albums[0]?.artwork ??
    artist.albums[0]?.tracks[0]?.poster ??
    null
  );
}

function albumArtwork(album: MusicAlbum): string | null {
  return album.artwork ?? album.tracks[0]?.poster ?? null;
}

function getAuthHeaders(): Record<string, string> | null {
  const token = getToken();
  const profileId = getProfileId();

  if (!token || !profileId) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`,
    'X-Profile-Id': profileId
  };
}

const QUICK_LINKS = [
  {
    href: '/music/recent',
    title: 'Recently Played',
    caption: 'Pick up where you left off',
    gradient: 'from-blue-600/80 to-blue-900/40',
    icon: 'M12 8v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z'
  },
  {
    href: '/music/repeat',
    title: 'On Repeat',
    caption: 'Your repeat favourites',
    gradient: 'from-cyan-600/80 to-blue-900/40',
    icon: 'M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3'
  },
  {
    href: '/music/top',
    title: 'Most Played',
    caption: 'Your all-time top songs',
    gradient: 'from-indigo-600/80 to-blue-900/40',
    icon: 'M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z'
  }
];

export default function MusicPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const { playTrack } = useAudioPlayer();

  const [home, setHome] = useState<MusicHome | null>(null);
  const [library, setLibrary] = useState<MusicLibrary | null>(null);
  const [genres, setGenres] = useState<string[]>([]);

  const [selectedGenre, setSelectedGenre] = useState('');
  const [filter, setFilter] = useState('');

  const [selectedArtist, setSelectedArtist] =
    useState<MusicArtist | null>(null);
  const [selectedAlbum, setSelectedAlbum] =
    useState<MusicAlbum | null>(null);

  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [libraryError, setLibraryError] = useState('');

  useEffect(() => {
    const headers = getAuthHeaders();

    if (!headers) {
      return;
    }

    fetch(`${API_URL}/music/home`, { headers })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((data: MusicHome) => {
        setHome({
          ...data,
          continuePlaying: data.continuePlaying
            ? normalizeTrack(data.continuePlaying)
            : null,
          onRepeat: (data.onRepeat ?? []).map(normalizeTrack),
          mostPlayed: (data.mostPlayed ?? []).map(normalizeTrack)
        });
      })
      .catch((error) => {
        console.error('Failed to load music home:', error);
      });
  }, [API_URL]);

  useEffect(() => {
    const headers = getAuthHeaders();

    if (!headers) {
      return;
    }

    fetch(`${API_URL}/media/music/genres`, { headers })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((data: string[]) => setGenres(data))
      .catch((error) => {
        console.error('Failed to load music genres:', error);
      });
  }, [API_URL]);

  useEffect(() => {
    const headers = getAuthHeaders();

    if (!headers) {
      return;
    }

    setLoadingLibrary(true);
    setLibraryError('');

    const params = new URLSearchParams();

    if (selectedGenre) {
      params.set('genre', selectedGenre);
    }

    const url =
      `${API_URL}/music/library` +
      (params.toString() ? `?${params.toString()}` : '');

    fetch(url, { headers })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((data: MusicLibrary) => {
        setLibrary(data);

        const firstArtist = data.artists?.[0] ?? null;

        setSelectedArtist(firstArtist);
        setSelectedAlbum(firstArtist?.albums?.[0] ?? null);
      })
      .catch((error) => {
        console.error('Failed to load music library:', error);
        setLibraryError('Could not load your music library.');
      })
      .finally(() => setLoadingLibrary(false));
  }, [API_URL, selectedGenre]);

  const allTracks = useMemo(() => {
    if (!library) {
      return [];
    }

    const tracks = new Map<number, MusicTrack>();

    library.artists.forEach((artist) => {
      artist.albums.forEach((album) => {
        album.tracks.forEach((track) => {
          tracks.set(track.id, track);
        });
      });
    });

    return Array.from(tracks.values());
  }, [library]);

  const jumpBackIn = useMemo(() => {
    const tracks = new Map<number, MusicTrack>();

    [...(home?.onRepeat ?? []), ...(home?.mostPlayed ?? [])].forEach(
      (track) => {
        tracks.set(track.id, track);
      }
    );

    return Array.from(tracks.values()).slice(0, 12);
  }, [home]);

  const artists = library?.artists ?? [];

  const filteredArtists = artists.filter((artist) => {
    const term = filter.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return (
      artist.name.toLowerCase().includes(term) ||
      artist.albums.some((album) =>
        album.name.toLowerCase().includes(term)
      )
    );
  });

  const continuePlaying = home?.continuePlaying ?? null;

  function playLibrary() {
    if (allTracks.length > 0) {
      playTrack(allTracks[0], allTracks);
    }
  }

  function selectArtist(artist: MusicArtist) {
    setSelectedArtist(artist);
    setSelectedAlbum(artist.albums?.[0] ?? null);
  }

  return (
    <MusicShell>

      {/* TOP BAR */}

      <div
        className="
          sticky
          top-0
          z-20
          flex
          items-center
          justify-between
          gap-4
          border-b
          border-white/5
          bg-[#050b18]/85
          px-4
          py-3
          backdrop-blur-xl
          sm:px-6
          lg:px-10
        "
      >

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-400/80">
            Your Library
          </p>
          <h1 className="text-lg font-bold sm:text-xl">
            Music
          </h1>
        </div>

        <div className="relative w-full max-w-sm">

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-zinc-500
            "
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>

          <input
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search artists or albums..."
            className="
              w-full
              rounded-full
              border
              border-white/10
              bg-white/5
              py-2.5
              pl-9
              pr-4
              text-sm
              text-white
              outline-none
              transition
              placeholder:text-zinc-500
              focus:border-blue-500/60
              focus:bg-white/[0.07]
            "
          />

        </div>

      </div>

      <div className="space-y-10 p-4 pb-16 sm:p-6 lg:p-10">

        {/* HERO */}

        <section
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-gradient-to-br
            from-blue-600
            via-blue-800
            to-[#050b18]
            p-6
            sm:p-10
          "
        >

          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative max-w-2xl">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100/70">
              Welcome back
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">
              Good evening
            </h2>

            <p className="mt-3 max-w-lg text-sm text-blue-100/70">
              {continuePlaying
                ? `Continue where you left off with "${continuePlaying.title}".`
                : 'Your movies, shows and music, all in one place.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">

              {continuePlaying && (
                <button
                  type="button"
                  onClick={() =>
                    playTrack(continuePlaying, jumpBackIn)
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    bg-white
                    px-6
                    py-3
                    text-sm
                    font-bold
                    text-black
                    shadow-xl
                    transition
                    hover:scale-105
                    hover:bg-blue-50
                  "
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                  Resume
                </button>
              )}

              <button
                type="button"
                onClick={playLibrary}
                disabled={allTracks.length === 0}
                className="
                  rounded-full
                  border
                  border-white/25
                  bg-white/10
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  backdrop-blur
                  transition
                  hover:bg-white/20
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Play library
              </button>

            </div>

          </div>

          {continuePlaying?.poster && (
            <img
              src={continuePlaying.poster}
              alt={continuePlaying.title}
              className="
                absolute
                bottom-0
                right-6
                hidden
                h-56
                w-56
                rounded-2xl
                object-cover
                shadow-2xl
                shadow-black/50
                lg:block
              "
            />
          )}

        </section>

        {/* QUICK LINKS */}

        <section>

          <h2 className="mb-4 text-xl font-bold">
            Jump back in
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  group
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  bg-gradient-to-r
                  ${link.gradient}
                  p-4
                  transition
                  hover:scale-[1.02]
                `}
              >

                <span
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-black/25
                    text-blue-200
                    backdrop-blur
                  "
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d={link.icon} />
                  </svg>
                </span>

                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {link.title}
                  </span>
                  <span className="block truncate text-xs text-blue-100/60">
                    {link.caption}
                  </span>
                </span>

              </Link>
            ))}

          </div>

        </section>

        {/* MADE FOR YOU */}

        {jumpBackIn.length > 0 && (
          <section>

            <div className="mb-4 flex items-end justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  Made for you
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Based on what you have been playing.
                </p>
              </div>

            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {jumpBackIn.map((track) => (
                <MusicCard
                  key={track.id}
                  image={track.poster}
                  title={track.title}
                  subtitle={track.artist}
                  onPlay={() => playTrack(track, jumpBackIn)}
                />
              ))}
            </div>

          </section>
        )}

        {/* GENRES + ARTISTS */}

        <section>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Your artists
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {filteredArtists.length} artist
                {filteredArtists.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">

              <button
                type="button"
                onClick={() => setSelectedGenre('')}
                className={`
                  shrink-0
                  rounded-full
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  transition
                  ${
                    selectedGenre === ''
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }
                `}
              >
                All genres
              </button>

              {genres.map((genre) => (
                <button
                  type="button"
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`
                    shrink-0
                    rounded-full
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    transition
                    ${
                      selectedGenre === genre
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }
                  `}
                >
                  {genre}
                </button>
              ))}

            </div>

          </div>

          {loadingLibrary ? (
            <div className="flex justify-center py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
            </div>
          ) : libraryError ? (
            <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              {libraryError}
            </p>
          ) : filteredArtists.length === 0 ? (
            <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center text-sm text-zinc-500">
              No artists match your search.
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {filteredArtists.map((artist) => (
                <MusicCard
                  key={artist.name}
                  image={artistArtwork(artist)}
                  title={artist.name}
                  subtitle={`${artist.albums.length} album${
                    artist.albums.length === 1 ? '' : 's'
                  }`}
                  round
                  active={selectedArtist?.name === artist.name}
                  onClick={() => selectArtist(artist)}
                />
              ))}
            </div>
          )}

        </section>

        {/* ALBUMS + TRACKS */}

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">

          <div>

            <div className="mb-4">
              <h2 className="text-xl font-bold">
                Albums
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {selectedArtist
                  ? `Albums by ${selectedArtist.name}`
                  : 'Select an artist to see their albums.'}
              </p>
            </div>

            {selectedArtist && selectedArtist.albums.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                {selectedArtist.albums.map((album) => (
                  <MusicCard
                    key={album.name}
                    image={albumArtwork(album)}
                    title={album.name}
                    subtitle={`${album.tracks.length} track${
                      album.tracks.length === 1 ? '' : 's'
                    }`}
                    active={selectedAlbum?.name === album.name}
                    onClick={() => setSelectedAlbum(album)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center text-sm text-zinc-500">
                No albums here.
              </p>
            )}

          </div>

          <div>

            <TrackList
              tracks={selectedAlbum?.tracks ?? []}
              showHeader
              showAlbum={false}
              title={selectedAlbum?.name ?? 'Tracks'}
              subtitle={
                selectedAlbum
                  ? `${selectedAlbum.tracks.length} songs${
                      selectedArtist
                        ? ` • ${selectedArtist.name}`
                        : ''
                    }`
                  : 'Pick an album to see its tracks.'
              }
              emptyText="Select an album to see its tracks."
            />

          </div>

        </section>

      </div>

    </MusicShell>
  );
}
