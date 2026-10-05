
'use client';

import {
  createContext,
  useContext,
  useState,
  useRef
} from 'react';

import {
  Capacitor
} from '@capacitor/core';

import {
  MediaControls
} from '@/app/lib/mediaControls';

const AudioPlayerContext =
  createContext<any>(null);

export function AudioPlayerProvider({
  children
}: {
  children: React.ReactNode;
}) {

  const [currentTrack, setCurrentTrack] =
    useState<any>(null);

  const audioRef =
    useRef<HTMLAudioElement>(null);

  const [showPlayer, setShowPlayer] =
    useState(false);

  const [playlist, setPlaylist] =
    useState<any[]>([]);

  /*
   * Changes every time a genuinely new playback
   * session begins.
   *
   * AudioPlayer uses this to tell the history system
   * that this is a NEW play.
   */
  const playbackSessionRef =
    useRef(0);


  function normalize(track: any) {

    return {
      ...track,
      id: track.id ?? track.mediaId
    };

  }


  function startNewPlaybackSession() {

    playbackSessionRef.current++;

    console.log(
      'NEW PLAYBACK SESSION',
      playbackSessionRef.current
    );

  }


  function playTrack(
    track: any,
    tracks: any[] = []
  ) {

    console.log(
      'PLAYTRACK CALLED'
    );

    console.log(track);

    const normalized =
      normalize(track);

    /*
     * Selecting a track explicitly always starts
     * a NEW playback session.
     */
    startNewPlaybackSession();

    setCurrentTrack(normalized);

    setShowPlayer(true);

    if (tracks.length > 0) {

      setPlaylist(
        tracks.map(normalize)
      );

    }

  }


  function nextTrack() {

    console.log(
      'CURRENT',
      currentTrack
    );

    console.log(
      'PLAYLIST',
      playlist
    );

    if (!currentTrack) {
      return;
    }

    const index =
      playlist.findIndex(
        p =>
          p.id === currentTrack.id
      );

    console.log(
      'INDEX',
      index
    );

    if (index === -1) {
      return;
    }

    const nextIndex =
      (index + 1) % playlist.length;

    /*
     * Next track = new playback session.
     */
    startNewPlaybackSession();

    setCurrentTrack(
      playlist[nextIndex]
    );

  }


  function previousTrack() {

    if (!currentTrack) {
      return;
    }

    const index =
      playlist.findIndex(
        p =>
          p.id === currentTrack.id
      );

    if (index > 0) {

      /*
       * Previous track = new playback session.
       */
      startNewPlaybackSession();

      setCurrentTrack(
        playlist[index - 1]
      );

    }

  }


  const closePlayer =
    async () => {

      if (
        Capacitor.isNativePlatform()
      ) {

        try {

          await MediaControls.pause();

        } catch {}

      }

      if (audioRef.current) {

        audioRef.current.pause();

        audioRef.current.currentTime = 0;

        audioRef.current.src = "";

      }

      setCurrentTrack(null);

      setPlaylist([]);

      setShowPlayer(false);

    };


  function syncToIndex(
    index: number
  ) {

    if (
      index < 0 ||
      index >= playlist.length
    ) {
      return;
    }

    /*
     * Native queue changed to another track.
     * This is a NEW playback session.
     */
    startNewPlaybackSession();

    setCurrentTrack(
      playlist[index]
    );

  }


  function setQueue(
    tracks: any[],
    startIndex: number
  ) {

    setPlaylist(tracks);

    /*
     * Initial native queue playback starts
     * a new session.
     */
    startNewPlaybackSession();

    setCurrentTrack(
      tracks[startIndex]
    );

  }


  return (

    <AudioPlayerContext.Provider
      value={{

        currentTrack,

        playlist,

        playTrack,

        nextTrack,

        previousTrack,

        syncToIndex,

        setCurrentTrack,

        setPlaylist,

        setQueue,

        audioRef,

        showPlayer,

        closePlayer,

        playbackSessionRef

      }}
    >

      {children}

    </AudioPlayerContext.Provider>

  );

}


export function useAudioPlayer() {

  return useContext(
    AudioPlayerContext
  );

}
