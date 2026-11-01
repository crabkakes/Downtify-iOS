export type AudioFormat = 'mp3' | 'flac' | 'm4a' | 'ogg' | 'opus';
export type BitrateOption = '128k' | '192k' | '256k' | '320k' | 'lossless';
export type SourcePlatform = 'spotify' | 'youtube' | 'soundcloud' | 'local' | 'csv';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface TrackSynthConfig {
  bpm: number;
  rootFreq: number;
  chords: number[][]; // chord frequencies in Hz
  melodyNotes: number[]; // melody note frequencies
  genre: 'synthwave' | 'pop' | 'rock' | 'lofi' | 'electronic' | 'rnb';
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  releaseYear: string;
  trackNumber: number;
  genre: string;
  duration: number; // in seconds
  coverUrl: string;
  source: SourcePlatform;
  sourceUrl?: string;
  format: AudioFormat;
  bitrate: BitrateOption;
  fileSizeMb: number;
  downloadedAt: number;
  lyrics: LyricLine[];
  isrc?: string;
  synthConfig?: TrackSynthConfig;
  customAudioUrl?: string;
}

export type DownloadStatus = 
  | 'queued'
  | 'fetching_embed'
  | 'matching_ytm'
  | 'extracting_audio'
  | 'transcoding'
  | 'embedding_tags'
  | 'completed'
  | 'failed';

export interface DownloadJob {
  id: string;
  url: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  progress: number; // 0 to 100
  status: DownloadStatus;
  stageLabel: string;
  format: AudioFormat;
  bitrate: BitrateOption;
  etaSeconds: number;
  fileSizeMb: number;
  sourcePlatform: SourcePlatform;
  error?: string;
  track?: Track;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  monitored: boolean;
  lastSynced?: string;
  sourceUrl?: string;
}

export interface DowntifySettings {
  defaultFormat: AudioFormat;
  defaultBitrate: BitrateOption;
  namingPattern: string;
  fetchLyrics: boolean;
  embedCoverArt: boolean;
  autoSyncMonitored: boolean;
  deviceFrameMode: 'iphone' | 'fullscreen';
  hapticsEnabled: boolean;
  storageLimitMb: number;
}
