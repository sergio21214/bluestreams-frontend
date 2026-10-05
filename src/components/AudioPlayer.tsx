'use client';

import {
  useCallback,
  useEffect,
  useRef
} from 'react';

import {
  Capacitor
} from '@capacitor/core';

import {
  useAudioPlayer
} from '@/app/context/AudioPlayerContext';

import {
  MediaControls
} from '@/app/lib/mediaControls';


export default function AudioPlayer() {

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

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


  const queuedPlaylistRef =
    useRef<any[] | null>(null);


  const isNative =
    Capacitor.isNativePlatform();


  /*
   * Last position sent to backend.
   */
  const lastSavedPosition =
    useRef(0);


  /*
   * Periodic history-saving interval.
   */
  const historyInterval =
    useRef<NodeJS.Timeout | null>(null);


  /*
   * Identifies which playback session has already
   * been announced to the backend.
   *
   * Every time playTrack(), nextTrack(), previousTrack()
   * or native track changes create a new session,
   * playbackSessionRef.current changes.
   *
   * The first history request belonging to that session
   * sends newSession=true.
   */
  const announcedSessionRef =
    useRef<number | null>(null);


  /*
   * Save playback history.
   *
   * IMPORTANT:
   *
   * We no longer use position < 5 to determine
   * whether this is a new play.
   *
   * Instead, the AudioPlayerContext gives us an
   * explicit playback session ID.
   */
  const saveHistory =
    useCallback(
      async (
        completed = false,
        track = currentTrack,
        forcedPosition?: number
      ) => {

        if (!track) {
          return;
        }


        const profileId =
          localStorage.getItem(
            'profileId'
          );

        if (!profileId) {
          return;
        }


        let position =
          forcedPosition ??
          Math.floor(
            audioRef.current?.currentTime || 0
          );


        /*
         * Native playback position.
         */
        if (isNative) {

          try {

            const status =
              await MediaControls.getStatus();

            /*
             * Only use native status when we
             * are not explicitly forcing a position.
             */
            if (
              forcedPosition === undefined
            ) {

              position =
                Math.floor(
                  status.positionMs / 1000
                );

            }

          } catch {

            if (
              forcedPosition === undefined
            ) {
              position = 0;
            }

          }

        }


        /*
         * Do not save insignificant automatic
         * progress updates.
         *
         * Explicitly forced saves are still allowed.
         *
         * Completed saves are always allowed.
         */
        const isForced =
          forcedPosition !== undefined;


        if (
          !isForced &&
          !completed &&
          position < 5
        ) {
          return;
        }


        /*
         * Determine whether this is the first
         * history request of the current playback session.
         */
        const sessionId =
          playbackSessionRef?.current ?? 0;


        const newSession =
          announcedSessionRef.current !== sessionId;


        if (newSession) {

          announcedSessionRef.current =
            sessionId;

        }


        const mediaId =
          track.id ??
          track.mediaId;


        const body = {

          mediaId,

          positionSeconds:
            position,

          completed,

          newSession

        };


        console.log(
          '========== SAVE HISTORY =========='
        );

        console.log(
          'Track:',
          track.title
        );

        console.log(
          'Media ID:',
          mediaId
        );

        console.log(
          'Position:',
          position
        );

        console.log(
          'Completed:',
          completed
        );

        console.log(
          'Session:',
          sessionId
        );

        console.log(
          'New Session:',
          newSession
        );

        console.log(
          '==================================='
        );


        fetch(
          `${API_URL}/music/history`,
          {

            method: 'POST',

            headers: {

              'Content-Type':
                'application/json',

              'X-Profile-Id':
                profileId

            },

            body:
              JSON.stringify(body)

          }
        )
        .catch(console.error);

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
   * Debug current track.
   */
  useEffect(() => {

    console.log(
      'CURRENT TRACK'
    );

    console.log(
      currentTrack
    );

    if (currentTrack) {

      console.log(
        'id =',
        currentTrack.id
      );

      console.log(
        'mediaId =',
        currentTrack.mediaId
      );

    }

  }, [currentTrack]);


  /*
   * Native playback events.
   */
  useEffect(() => {

    if (!isNative) {
      return;
    }


    const stateHandle =
      MediaControls.addListener(
        'playbackStateChanged',
        () => {}
      );


    /*
     * Native track finished.
     */
    const endedHandle =
      MediaControls.addListener(
        'trackEnded',
        async () => {

          console.log(
            'NATIVE TRACK ENDED'
          );


          await saveHistory(
            true,
            currentTrack,
            0
          );

        }
      );


    /*
     * Native queue changed track.
     */
    const changedHandle =
      MediaControls.addListener(
        'trackChanged',
        async (event) => {

          console.log(
            'NATIVE TRACK CHANGED',
            event.index
          );


          /*
           * Save the previous track.
           *
           * Position 0 here is intentional:
           * we are explicitly saving the transition,
           * not telling the backend to reset a session.
           */
          await saveHistory(
            false,
            currentTrack,
            0
          );


          syncToIndex(
            event.index
          );

        }
      );


    return () => {

      stateHandle.then(
        h => h.remove()
      );

      endedHandle.then(
        h => h.remove()
      );

      changedHandle.then(
        h => h.remove()
      );

    };

  }, [
    isNative,
    currentTrack,
    saveHistory,
    syncToIndex
  ]);


  /*
   * Native playlist / queue setup.
   */
  useEffect(() => {

    if (!isNative) {
      return;
    }


    if (
      !currentTrack ||
      playlist.length === 0
    ) {
      return;
    }


    if (
      queuedPlaylistRef.current === playlist
    ) {
      return;
    }


    queuedPlaylistRef.current =
      playlist;


    const startIndex =
      Math.max(
        0,
        playlist.findIndex(
          (p: any) =>
            p.id ===
            (
              currentTrack.id ??
              currentTrack.mediaId
            )
        )
      );


    const tracks =
      playlist.map(
        (track: any) => ({

          url:
            `${API_URL}/music/stream/${track.id}`,

          title:
            track.title,

          artist:
            track.artist || '',

          album:
            track.album || '',

          artwork:
            track.poster

        })
      );


    MediaControls
      .setQueue({
        tracks,
        startIndex
      })
      .then(
        () =>
          MediaControls.play()
      )
      .catch(
        err =>
          console.error(
            'Native setQueue failed',
            err
          )
      );


  }, [
    isNative,
    playlist,
    currentTrack,
    API_URL
  ]);


  /*
   * Browser audio setup.
   */
  useEffect(() => {

    if (isNative) {
      return;
    }


    const audio =
      audioRef.current;


    if (
      !audio ||
      !currentTrack
    ) {
      return;
    }


    audio.pause();


    audio.src =
      `${API_URL}/music/stream/${
        currentTrack.id ??
        currentTrack.mediaId
      }`;


    audio.load();


    audio.play()
      .catch(
        (error: unknown) => {

          if (
            error instanceof DOMException
          ) {

            if (
              error.name !==
              'AbortError'
            ) {

              console.error(
                error
              );

            }

            return;
          }


          console.error(
            error
          );

        }
      );


    /*
     * Browser Media Session.
     */
    if (
      'mediaSession' in navigator
    ) {

      navigator.mediaSession.metadata =
        new MediaMetadata({

          title:
            currentTrack.title,

          artist:
            currentTrack.artist || '',

          album:
            currentTrack.album || '',

          artwork: [
            {

              src:
                currentTrack.poster,

              sizes:
                '512x512',

              type:
                'image/jpeg'

            }
          ]

        });


      navigator.mediaSession
        .setActionHandler(
          'play',
          () =>
            audio.play()
        );


      navigator.mediaSession
        .setActionHandler(
          'pause',
          () =>
            audio.pause()
        );


      navigator.mediaSession
        .setActionHandler(
          'nexttrack',
          nextTrack
        );


      navigator.mediaSession
        .setActionHandler(
          'previoustrack',
          previousTrack
        );


      navigator.mediaSession
        .setActionHandler(
          'seekforward',
          () => {

            audio.currentTime =
              Math.min(
                audio.duration,
                audio.currentTime + 10
              );

          }
        );


      navigator.mediaSession
        .setActionHandler(
          'seekbackward',
          () => {

            audio.currentTime =
              Math.max(
                0,
                audio.currentTime - 10
              );

          }
        );

    }


    /*
     * Update Media Session position.
     */
    const updatePosition =
      () => {

        if (
          'mediaSession' in navigator &&
          navigator.mediaSession
            .setPositionState
        ) {

          try {

            navigator.mediaSession
              .setPositionState({

                duration:
                  audio.duration || 0,

                playbackRate:
                  audio.playbackRate,

                position:
                  audio.currentTime

              });

          } catch {}

        }

      };


    audio.addEventListener(
      'timeupdate',
      updatePosition
    );


    return () => {

      audio.removeEventListener(
        'timeupdate',
        updatePosition
      );

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


    if (
      historyInterval.current
    ) {

      clearInterval(
        historyInterval.current
      );

    }


    lastSavedPosition.current =
      0;


    historyInterval.current =
      setInterval(
        async () => {

          let seconds = 0;


          /*
           * Native position.
           */
          if (isNative) {

            try {

              const status =
                await MediaControls.getStatus();

              seconds =
                Math.floor(
                  status.positionMs / 1000
                );

            } catch {

              return;

            }

          }

          /*
           * Browser position.
           */
          else {

            seconds =
              Math.floor(
                audioRef.current
                  ?.currentTime || 0
              );

          }


          /*
           * Save every ~10 seconds.
           */
          if (
            Math.abs(
              seconds -
              lastSavedPosition.current
            ) >= 10
          ) {

            lastSavedPosition.current =
              seconds;


            await saveHistory(
              false
            );

          }

        },
        10000
      );


    return () => {

      if (
        historyInterval.current
      ) {

        clearInterval(
          historyInterval.current
        );

      }


      /*
       * Save the latest position when
       * the effect is cleaned up.
       */
      saveHistory(
        false
      );

    };

  }, [
    currentTrack,
    isNative,
    saveHistory,
    audioRef
  ]);


  /*
   * Play button.
   */
  function handlePlay() {

    if (isNative) {

      MediaControls
        .play()
        .catch(
          console.error
        );

    } else {

      audioRef.current
        ?.play()
        .catch(
          console.error
        );

    }

  }


  /*
   * Pause button.
   */
  function handlePause() {

    if (isNative) {

      MediaControls
        .pause()
        .then(
          () =>
            saveHistory(false)
        )
        .catch(
          console.error
        );

    } else {

      audioRef.current?.pause();

      saveHistory(false);

    }

  }


  /*
   * Next button.
   */
  async function handleNext() {

    await saveHistory(
      false,
      currentTrack,
      0
    );


    if (isNative) {

      MediaControls
        .skipToNext()
        .catch(
          console.error
        );

    } else {

      nextTrack();

    }

  }


  /*
   * Previous button.
   */
  async function handlePrevious() {

    await saveHistory(
      false,
      currentTrack,
      0
    );


    if (isNative) {

      MediaControls
        .skipToPrevious()
        .catch(
          console.error
        );

    } else {

      previousTrack();

    }

  }


  /*
   * Player hidden.
   */
  if (
    !showPlayer ||
    !currentTrack
  ) {

    return null;

  }


  return (

    <div
      className="
        h-24
        bg-zinc-950
        border-t
        border-zinc-800
        flex
        items-center
        justify-between
        px-6
        shrink-0
      "
    >

      {/* LEFT */}

      <div
        className="
          flex
          items-center
          gap-4
          min-w-0
        "
      >

        <img
          src={
            currentTrack.poster
          }
          className="
            w-14
            h-14
            rounded-lg
            object-cover
          "
        />


        <div
          className="
            min-w-0
          "
        >

          <p
            className="
              font-semibold
              truncate
            "
          >
            {currentTrack.title}
          </p>


          <p
            className="
              text-sm
              text-zinc-400
              truncate
            "
          >
            {currentTrack.artist}
          </p>

        </div>

      </div>


      {/* CENTER */}

      <div
        className="
          flex
          justify-center
        "
      >

        {!isNative && (

          <audio
            ref={audioRef}
            controls
            preload="metadata"
            crossOrigin="anonymous"

            /*
             * Browser pause.
             *
             * IMPORTANT:
             * This does NOT create a new session.
             */
            onPause={
              async () => {

                await saveHistory(
                  false,
                  currentTrack
                );

              }
            }


            /*
             * Browser track ended.
             */
            onEnded={
              async () => {

                console.log(
                  'TRACK ENDED',
                  currentTrack?.title
                );


                await saveHistory(
                  true,
                  currentTrack,
                  0
                );


                nextTrack();

              }
            }

          />

        )}

      </div>


      {/* RIGHT */}

      <div
        className="
          flex
          justify-end
          items-center
          gap-3
        "
      >

        <button
          onClick={
            handlePrevious
          }
        >
          ⏮
        </button>


        <button
          onClick={
            handlePlay
          }
        >
          ▶
        </button>


        <button
          onClick={
            handlePause
          }
        >
          ⏸
        </button>


        <button
          onClick={
            handleNext
          }
        >
          ⏭
        </button>


        <button
          onClick={
            closePlayer
          }
          className="
            w-9
            h-9
            rounded-full
            hover:bg-zinc-800
            transition
            text-lg
          "
        >
          ✕
        </button>

      </div>

    </div>

  );

}

