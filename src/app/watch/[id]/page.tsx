'use client';

import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  useParams,
  useRouter
} from 'next/navigation';

import { Capacitor } from '@capacitor/core';
import {
  StatusBar,
  Style
} from '@capacitor/status-bar';

export default function WatchPage() {

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const MEDIA_URL =
    process.env.NEXT_PUBLIC_MEDIA_URL;

  const params =
    useParams();

  const router =
    useRouter();

  const id =
    params.id;

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const saveTimerRef =
    useRef<NodeJS.Timeout | null>(
      null
    );

  const [media, setMedia] =
    useState<any>(null);

  const [resumePosition, setResumePosition] =
    useState(0);

  /*
   * Load media
   */

  useEffect(() => {

    if (!id) {
      return;
    }

    fetch(
      `${API_URL}/media/${id}`
    )
      .then((res) => {

        if (!res.ok) {
          throw new Error(
            `Failed to load media: ${res.status}`
          );
        }

        return res.json();

      })
      .then(setMedia)
      .catch(console.error);

  }, [id, API_URL]);

  /*
   * Load resume position
   */

  useEffect(() => {

    if (!id) {
      return;
    }

    const profileId =
      localStorage.getItem(
        'profileId'
      );

    if (!profileId) {
      return;
    }

    fetch(
      `${API_URL}/history/resume/${id}`,
      {
        headers: {
          'X-Profile-Id':
            profileId
        }
      }
    )
      .then(async (res) => {

        if (!res.ok) {
          return null;
        }

        const text =
          await res.text();

        if (!text) {
          return null;
        }

        return JSON.parse(text);

      })
      .then((history) => {

        if (
          history &&
          history.positionSeconds
        ) {

          setResumePosition(
            history.positionSeconds
          );

        }

      })
      .catch(console.error);

  }, [id, API_URL]);

  /*
   * Shaka Player
   */

  useEffect(() => {

    if (!media) {
      return;
    }

    let player: any = null;
    let ui: any = null;

    const loadPlayer = async () => {

      if (
        !videoRef.current ||
        !containerRef.current
      ) {
        return;
      }

      const shaka =
        await import(
          'shaka-player/dist/shaka-player.ui.js'
        );

      await import(
        'shaka-player/dist/controls.css'
      );

      shaka.default.polyfill.installAll();

      if (
        !shaka.default.Player
          .isBrowserSupported()
      ) {

        console.error(
          'Browser not supported'
        );

        return;
      }

      /*
       * Create Shaka player
       */

      player =
        new shaka.default.Player();

      await player.attach(
        videoRef.current
      );

      /*
       * Create Shaka UI
       */

      ui =
        new shaka.default.ui.Overlay(
          player,
          containerRef.current,
          videoRef.current
        );

      ui.configure({

        controlPanelElements: [
          'play_pause',
          'time_and_duration',
          'spacer',
          'mute',
          'volume',
          'fullscreen',
          'overflow_menu'
        ],

        overflowMenuButtons: [
          'quality',
          'language',
          'captions',
          'playback_rate'
        ]

      });

      /*
       * Load DASH
       */

      await player.load(
        media.manifestUrl
      );

      console.log(
        'DASH LOADED'
      );

      /*
       * Resume playback
       */

      if (
        resumePosition > 10 &&
        videoRef.current
      ) {

        const video =
          videoRef.current;

        const resume =
          () => {

            console.log(
              'RESUMING AT',
              resumePosition
            );

            if (
              Number.isFinite(
                resumePosition
              )
            ) {

              video.currentTime =
                resumePosition;

            }

          };

        if (
          video.readyState >= 1
        ) {

          resume();

        } else {

          video.addEventListener(
            'loadedmetadata',
            resume,
            {
              once: true
            }
          );

        }

      }

      /*
       * Capacitor fullscreen handling
       */

      if (
        Capacitor.isNativePlatform() &&
        videoRef.current
      ) {

        const handleFullscreenChange =
          async () => {

            if (
              document.fullscreenElement
            ) {

              await StatusBar.hide();

            } else {

              await StatusBar.show();

              await StatusBar.setStyle({
                style: Style.Dark
              });

            }

          };

        videoRef.current.addEventListener(
          'fullscreenchange',
          handleFullscreenChange
        );

      }

      /*
       * Load subtitles
       */

      try {

        const subtitleResponse =
          await fetch(
            `${API_URL}/subtitles/${encodeURIComponent(
              media.folderName
            )}/list`
          );

        if (
          subtitleResponse.ok
        ) {

          console.log(
            'SUBTITLE LIST STATUS',
            subtitleResponse.status
          );

          const subtitles =
            await subtitleResponse.json();

          for (
            const subtitle
            of subtitles
          ) {

            const subtitleUrl =
              `${MEDIA_URL}/subtitles/${encodeURIComponent(
                media.folderName
              )}/${subtitle.file}`;

            console.log(
              'LOADING SUBTITLE:',
              subtitleUrl
            );

            try {

              const test =
                await fetch(
                  subtitleUrl
                );

              console.log(
                'SUBTITLE HTTP',
                test.status,
                subtitleUrl
              );

            } catch (err) {

              console.error(
                'SUBTITLE TEST FAILED',
                err
              );

            }

            await player.addTextTrackAsync(

              subtitleUrl,

              subtitle.lang || 'und',

              'subtitles',

              'text/vtt',

              '',

              subtitle.label

            );

          }

        }

      } catch (err) {

        console.error(
          'SUBTITLE ERROR',
          err
        );

      }

      /*
       * Save playback history
       */

      const profileId =
        localStorage.getItem(
          'profileId'
        );

      if (
        profileId &&
        videoRef.current
      ) {

        saveTimerRef.current =
          setInterval(async () => {

            if (
              !videoRef.current
            ) {
              return;
            }

            const current =
              Math.floor(
                videoRef.current.currentTime
              );

            const duration =
              Math.floor(
                videoRef.current.duration || 0
              );

            const completed =
              duration > 0 &&
              current >=
                duration * 0.95;

            try {

              await fetch(
                `${API_URL}/history`,
                {
                  method: 'POST',

                  headers: {
                    'Content-Type':
                      'application/json',

                    'X-Profile-Id':
                      profileId
                  },

                  body: JSON.stringify({

                    mediaId:
                      media.id,

                    positionSeconds:
                      current,

                    completed

                  })
                }
              );

            } catch (err) {

              console.error(
                'HISTORY SAVE ERROR',
                err
              );

            }

          }, 10000);

      }

    };

    loadPlayer();

    /*
     * Cleanup
     */

    return () => {

      if (
        saveTimerRef.current
      ) {

        clearInterval(
          saveTimerRef.current
        );

        saveTimerRef.current =
          null;

      }

      if (player) {

        player.destroy();

      }

      if (ui) {

        ui.destroy();

      }

    };

  }, [
    media,
    resumePosition,
    API_URL,
    MEDIA_URL
  ]);

  /*
   * Loading
   */

  if (!media) {

    return (

      <main
        className="
          min-h-screen
          bg-black
          text-white
          flex
          items-center
          justify-center
        "
      >

        <div
          className="
            flex
            flex-col
            items-center
            gap-4
          "
        >

          <div
            className="
              w-10
              h-10
              border-4
              border-zinc-700
              border-t-white
              rounded-full
              animate-spin
            "
          />

          <span
            className="
              text-zinc-400
            "
          >
            Loading...
          </span>

        </div>

      </main>

    );

  }

  /*
   * Watch page
   */

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
      "
    >

      {/* Header */}

      <header
        className="
          sticky
          top-0
          z-50
          bg-black/95
          backdrop-blur
          border-b
          border-zinc-900
        "
      >

        <div
          className="
            max-w-[1600px]
            mx-auto
            px-4
            sm:px-6
            lg:px-10
            py-4
            flex
            items-center
            gap-4
          "
        >

          {/* Back button */}

          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="
              flex
              items-center
              justify-center
              w-11
              h-11
              rounded-full
              bg-zinc-900
              hover:bg-zinc-800
              active:bg-zinc-700
              transition
              shrink-0
            "
          >

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="
                w-6
                h-6
              "
            >

              <path
                d="M19 12H5"
              />

              <path
                d="M12 19l-7-7 7-7"
              />

            </svg>

          </button>

          {/* Title */}

          <div
            className="
              min-w-0
              flex-1
            "
          >

            <h1
              className="
                text-xl
                sm:text-2xl
                lg:text-3xl
                font-bold
                truncate
              "
            >
              {media.title ||
                media.name ||
                'Watching'}
            </h1>

            {media.type && (

              <p
                className="
                  text-sm
                  text-zinc-400
                  mt-0.5
                "
              >
                {media.type}
              </p>

            )}

          </div>

        </div>

      </header>

      {/* Content */}

      <div
        className="
          max-w-[1600px]
          mx-auto
          px-4
          sm:px-6
          lg:px-10
          py-6
          sm:py-8
        "
      >

        {/* Player */}

        <section
          className="
            w-full
          "
        >

          <div
            ref={containerRef}
            className="
              relative
              w-full
              aspect-video
              bg-black
              rounded-xl
              sm:rounded-2xl
              overflow-hidden
              shadow-2xl
            "
          >

            <video
              ref={videoRef}
              autoPlay
              controls
              playsInline
              className="
                absolute
                inset-0
                w-full
                h-full
                object-contain
                bg-black
              "
              onDoubleClick={() => {

                const video =
                  videoRef.current;

                if (!video) {
                  return;
                }

                if (
                  !document.fullscreenElement
                ) {

                  video.requestFullscreen?.();

                } else {

                  document.exitFullscreen?.();

                }

              }}
            />

          </div>

        </section>

        {/* Information */}

        <section
          className="
            mt-6
            sm:mt-8
            max-w-5xl
          "
        >

          <h2
            className="
              text-2xl
              sm:text-3xl
              font-bold
            "
          >
            {media.title ||
              media.name ||
              'Watching'}
          </h2>

          {media.description && (

            <p
              className="
                mt-3
                text-zinc-400
                leading-relaxed
              "
            >
              {media.description}
            </p>

          )}

        </section>

      </div>

    </main>

  );
}