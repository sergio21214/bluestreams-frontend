'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { Capacitor } from '@capacitor/core';

import { useAudioPlayer } from '@/app/context/AudioPlayerContext';
import { MediaControls } from '@/app/lib/mediaControls';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;

  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export default function AudioPlayer() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const {
    currentTrack,
    playlist,
    nextTrack,
    previousTrack,
    syncToIndex,
    audioRef,
    closePlayer,
    showPlayer,
    playbackSessionRef
  } = useAudioPlayer();

  const queuedPlaylistRef = useRef<unknown[] | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const lastSavedPosition = useRef(0);
  const historyInterval = useRef<NodeJS.Timeout | null>(null);
  const announcedSessionRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const saveHistory = useCallback(
    async (
      completed = false,
      track = currentTrack,
      forcedPosition?: number
    ) => {
      if (!track) {
        return;
      }

      const profileId = localStorage.getItem('profileId');

      if (!profileId) {
        return;
      }

      let current =
        forcedPosition ??
        Math.floor(audioRef.current?.currentTime || 0);

      if (isNative) {
        try {
          const status = await MediaControls.getStatus();

          if (forcedPosition === undefined) {
            current = Math.floor(status.positionMs / 1000);
          }
        } catch {
          if (forcedPosition === undefined) {
            current = 0;
          }
        }
      }

      const isForced = forcedPosition !== undefined;

      if (!isForced && !completed && current < 5) {
        return;
      }

      const sessionId = playbackSessionRef?.current ?? 0;
      const newSession = announcedSessionRef.current !== sessionId;

      if (newSession) {
        announcedSessionRef.current = sessionId;
      }

      const mediaId = track.id ?? track.mediaId;

      const body = {
        mediaId,
        positionSeconds: current,
        completed,
        newSession
      };

      fetch(`${API_URL}/music/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Profile-Id': profileId
        },
        body: JSON.stringify(body)
      }).catch(console.error);
    },
    [
      API_URL,
      currentTrack,
      isNative,
      audioRef,
      playbackSessionRef
    ]
  );

  /*
   * Keep the browser audio element volume in sync.
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef, currentTrack]);

  /*
   * Native playback state polling.
   */
  useEffect(() => {
    if (!isNative || !currentTrack) {
      return;
    }

    let cancelled = false;

    const update = async () => {
      try {
        const status = await MediaControls.getStatus();

        if (cancelled) {
          return;
        }

        setPosition(status.positionMs / 1000);
        setDuration(status.durationMs / 1000);
        setIsPlaying(status.isPlaying);
      } catch {
        // Ignore transient native status errors.
      }
    };

    update();

    const timer = setInterval(update, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isNative, currentTrack]);

  /*
   * Native playback events.
   */
  useEffect(() => {
    if (!isNative) {
      return;
    }

    const stateHandle = MediaControls.addListener(
      'playbackStateChanged',
      (event) => {
        setIsPlaying(event.isPlaying);
        setPosition(event.positionMs / 1000);
        setDuration(event.durationMs / 1000);
      }
    );

    const endedHandle = MediaControls.addListener(
      'trackEnded',
      async () => {
        await saveHistory(true, currentTrack, 0);
      }
    );

    const changedHandle = MediaControls.addListener(
      'trackChanged',
      async (event) => {
        await saveHistory(false, currentTrack, 0);
        syncToIndex(event.index);
      }
    );

    return () => {
      stateHandle.then((handle) => handle.remove());
      endedHandle.then((handle) => handle.remove());
      changedHandle.then((handle) => handle.remove());
    };
  }, [isNative, currentTrack, saveHistory, syncToIndex]);

  /*
   * Native playlist / queue setup.
   */
  useEffect(() => {
    if (!isNative) {
      return;
    }

    if (!currentTrack || playlist.length === 0) {
      return;
    }

    if (queuedPlaylistRef.current === playlist) {
      return;
    }

    queuedPlaylistRef.current = playlist;

    const startIndex = Math.max(
      0,
      playlist.findIndex(
        (item: { id?: number; mediaId?: number }) =>
          item.id === (currentTrack.id ?? currentTrack.mediaId)
      )
    );

    const tracks = playlist.map(
      (track: {
        id?: number;
        mediaId?: number;
        title: string;
        artist?: string;
        album?: string;
        poster?: string;
      }) => ({
        url: `${API_URL}/music/stream/${track.id ?? track.mediaId}`,
        title: track.title,
        artist: track.artist || '',
        album: track.album || '',
        artwork: track.poster
      })
    );

    MediaControls.setQueue({
      tracks,
      startIndex
    })
      .then(() => {
        setIsPlaying(true);
        return MediaControls.play();
      })
      .catch((error) => {
        console.error('Native setQueue failed', error);
      });
  }, [isNative, playlist, currentTrack, API_URL]);

  /*
   * Browser audio setup.
   */
  useEffect(() => {
    if (isNative) {
      return;
    }

    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    audio.pause();

    audio.src = `${API_URL}/music/stream/${
      currentTrack.id ?? currentTrack.mediaId
    }`;

    audio.load();

    audio.play().catch((error: unknown) => {
      if (error instanceof DOMException) {
        if (error.name !== 'AbortError') {
          console.error(error);
        }

        return;
      }

      console.error(error);
    });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist || '',
        album: currentTrack.album || '',
        artwork: [
          {
            src: currentTrack.poster,
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audio.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
      });

      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
      navigator.mediaSession.setActionHandler(
        'previoustrack',
        previousTrack
      );

      navigator.mediaSession.setActionHandler('seekforward', () => {
        audio.currentTime = Math.min(
          audio.duration,
          audio.currentTime + 10
        );
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
      });
    }

    const updatePositionState = () => {
      if (
        'mediaSession' in navigator &&
        navigator.mediaSession.setPositionState
      ) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration || 0,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
          });
        } catch {
          // Ignore unsupported position states.
        }
      }
    };

    audio.addEventListener('timeupdate', updatePositionState);

    return () => {
      audio.removeEventListener('timeupdate', updatePositionState);
    };
  }, [
    isNative,
    currentTrack,
    nextTrack,
    previousTrack,
    API_URL,
    audioRef
  ]);

  /*
   * Periodic history saving.
   */
  useEffect(() => {
    if (!currentTrack) {
      return;
    }

    if (historyInterval.current) {
      clearInterval(historyInterval.current);
    }

    lastSavedPosition.current = 0;

    historyInterval.current = setInterval(async () => {
      let seconds = 0;

      if (isNative) {
        try {
          const status = await MediaControls.getStatus();
          seconds = Math.floor(status.positionMs / 1000);
        } catch {
          return;
        }
      } else {
        seconds = Math.floor(audioRef.current?.currentTime || 0);
      }

      if (
        Math.abs(seconds - lastSavedPosition.current) >= 10
      ) {
        lastSavedPosition.current = seconds;
        await saveHistory(false);
      }
    }, 10000);

    return () => {
      if (historyInterval.current) {
        clearInterval(historyInterval.current);
      }

      saveHistory(false);
    };
  }, [currentTrack, isNative, saveHistory, audioRef]);

  function handlePlay() {
    setIsPlaying(true);

    if (isNative) {
      MediaControls.play().catch(console.error);
    } else {
      audioRef.current?.play().catch(console.error);
    }
  }

  function handlePause() {
    setIsPlaying(false);

    if (isNative) {
      MediaControls.pause()
        .then(() => saveHistory(false))
        .catch(console.error);
    } else {
      audioRef.current?.pause();
      saveHistory(false);
    }
  }

  function togglePlay() {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }

  async function handleNext() {
    await saveHistory(false, currentTrack, 0);

    if (isNative) {
      MediaControls.skipToNext().catch(console.error);
    } else {
      nextTrack();
    }
  }

  async function handlePrevious() {
    await saveHistory(false, currentTrack, 0);

    if (isNative) {
      MediaControls.skipToPrevious().catch(console.error);
    } else {
      previousTrack();
    }
  }

  function handleSeek(value: number) {
    setPosition(value);

    if (isNative) {
      MediaControls.seekTo({ positionMs: value * 1000 }).catch(
        console.error
      );
      return;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  }

  if (!showPlayer || !currentTrack) {
    return null;
  }

  const safeDuration = Number.isFinite(duration) ? duration : 0;

  return (
    <div
      className="
        h-24
        shrink-0
        border-t
        border-white/10
        bg-[#081020]/95
        px-4
        backdrop-blur-xl
        md:px-6
      "
    >
      <div className="flex h-full items-center gap-4">

        {/* TRACK INFO */}

        <div className="flex min-w-0 items-center gap-3 md:w-1/4">

          <img
            src={currentTrack.poster}
            alt={currentTrack.title}
            className="
              h-14
              w-14
              shrink-0
              rounded-xl
              object-cover
              shadow-lg
              shadow-black/40
            "
          />

          <div className="min-w-0">

            <p className="truncate text-sm font-semibold md:text-base">
              {currentTrack.title}
            </p>

            <p className="truncate text-xs text-zinc-400 md:text-sm">
              {currentTrack.artist}
            </p>

          </div>

        </div>

        {/* TRANSPORT */}

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={handlePrevious}
              aria-label="Previous track"
              className="
                rounded-full
                p-2
                text-zinc-300
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-blue-600
                text-white
                shadow-lg
                shadow-blue-900/40
                transition
                hover:scale-105
                hover:bg-blue-500
                active:scale-95
              "
            >
              {isPlaying ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M7 5h4v14H7V5zm6 0h4v14h-4V5z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-0.5 h-5 w-5"
                >
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next track"
              className="
                rounded-full
                p-2
                text-zinc-300
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M16 6h2v12h-2V6zM6 6l8.5 6L6 18V6z" />
              </svg>
            </button>

          </div>

          <div className="hidden w-full max-w-md items-center gap-2 sm:flex">

            <span className="w-10 text-right text-[11px] tabular-nums text-zinc-500">
              {formatTime(position)}
            </span>

            <input
              type="range"
              min={0}
              max={Math.max(safeDuration, 1)}
              step={1}
              value={Math.min(position, Math.max(safeDuration, 1))}
              onChange={(event) =>
                handleSeek(Number(event.target.value))
              }
              disabled={safeDuration <= 0}
              aria-label="Seek"
              className="
                h-1
                flex-1
                cursor-pointer
                appearance-none
                rounded-full
                bg-zinc-700
                accent-blue-500
              "
            />

            <span className="w-10 text-[11px] tabular-nums text-zinc-500">
              {formatTime(safeDuration)}
            </span>

          </div>

        </div>

        {/* VOLUME + CLOSE */}

        <div className="flex items-center justify-end gap-2 md:w-1/4">

          {!isNative && (
            <div className="hidden items-center gap-2 md:flex">

              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-zinc-400"
              >
                <path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12z" />
              </svg>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) =>
                  setVolume(Number(event.target.value))
                }
                aria-label="Volume"
                className="
                  h-1
                  w-24
                  cursor-pointer
                  appearance-none
                  rounded-full
                  bg-zinc-700
                  accent-blue-500
                "
              />

            </div>
          )}

          <button
            type="button"
            onClick={closePlayer}
            aria-label="Close player"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              text-zinc-400
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

        </div>

        {/* HIDDEN BROWSER AUDIO */}

        {!isNative && (
          <audio
            ref={audioRef}
            preload="metadata"
            className="hidden"
            onPlay={() => setIsPlaying(true)}
            onPause={async () => {
              setIsPlaying(false);
              await saveHistory(false, currentTrack);
            }}
            onTimeUpdate={() => {
              if (!audioRef.current) {
                return;
              }

              setPosition(audioRef.current.currentTime);
              setDuration(audioRef.current.duration || 0);
            }}
            onLoadedMetadata={() => {
              if (!audioRef.current) {
                return;
              }

              setDuration(audioRef.current.duration || 0);
              audioRef.current.volume = volume;
            }}
            onEnded={async () => {
              await saveHistory(true, currentTrack, 0);
              nextTrack();
            }}
          />
        )}

      </div>
    </div>
  );
}
