import {
  registerPlugin,
  PluginListenerHandle
} from '@capacitor/core';

export interface MediaControlsTrack {
  url: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
}

export interface PlaybackStateChangedEvent {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
}

export interface TrackChangedEvent {
  index: number;
}

export interface MediaControlsStatus {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
}

export interface MediaControlsPlugin {

  setQueue(options: {
    tracks: MediaControlsTrack[];
    startIndex: number;
  }): Promise<void>;

  play(): Promise<void>;

  pause(): Promise<void>;

  seekTo(options: {
    positionMs: number;
  }): Promise<void>;

  skipToNext(): Promise<void>;

  skipToPrevious(): Promise<void>;

  getStatus(): Promise<MediaControlsStatus>;

  addListener(
    eventName: 'playbackStateChanged',
    listenerFunc: (event: PlaybackStateChangedEvent) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'trackEnded',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'trackChanged',
    listenerFunc: (event: TrackChangedEvent) => void
  ): Promise<PluginListenerHandle>;

  removeAllListeners(): Promise<void>;
}

export const MediaControls =
  registerPlugin<MediaControlsPlugin>(
    'MediaControls'
  );