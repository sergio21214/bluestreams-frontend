export type MusicTrack = {
  id: number;
  mediaId?: number;
  title: string;
  artist?: string | null;
  album?: string | null;
  poster?: string | null;
  durationMs?: number | null;
  trackNumber?: number | null;
  genre?: string | null;
  playCount?: number;
  positionSeconds?: number;
  lastPlayed?: string | null;
};

export type MusicAlbum = {
  name: string;
  artwork?: string | null;
  tracks: MusicTrack[];
};

export type MusicArtist = {
  name: string;
  albums: MusicAlbum[];
};

export type MusicLibrary = {
  artists: MusicArtist[];
};

export type MusicHome = {
  continuePlaying?: MusicTrack | null;
  onRepeat?: MusicTrack[];
  mostPlayed?: MusicTrack[];
  favorites?: MusicTrack[];
};

export type MediaItem = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  description?: string;
  poster?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  manifestUrl?: string | null;
  mediaType?: string;
  seriesTitle?: string | null;
  year?: number | string | null;
  genre?: string | null;
  type?: string;
};
