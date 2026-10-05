'use client';

import {
  createContext,
  useContext,
  useState
} from 'react';

type Track = {
  id: number;
  title: string;
  artist?: string;
  cover?: string;
  manifestUrl: string;
};

type AudioPlayerContextType = {
  currentTrack: Track | null;
  setCurrentTrack: (
    track: Track | null
  ) => void;
};

const AudioPlayerContext =
  createContext<AudioPlayerContextType>({
    currentTrack: null,
    setCurrentTrack: () => {}
  });

export function AudioPlayerProvider({
  children
}: {
  children: React.ReactNode;
}) {

  const [
    currentTrack,
    setCurrentTrack
  ] = useState<Track | null>(null);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        setCurrentTrack
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