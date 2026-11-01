import { DownloadJob, Track, AudioFormat, BitrateOption, SourcePlatform } from '../types';
import { QUICK_DEMO_LINKS } from '../data/mockCatalog';

// Generates realistic synth config based on title hash so synthesized audio sounds distinct
function generateSynthForTrack(title: string, artist: string) {
  const seed = (title + artist).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bpms = [85, 95, 105, 116, 124, 130, 160];
  const bpm = bpms[seed % bpms.length];

  const rootFreqs = [196, 220, 246.94, 261.63, 293.66, 329.63];
  const root = rootFreqs[seed % rootFreqs.length];

  const chords = [
    [root, root * 1.25, root * 1.5],
    [root * 0.75, root, root * 1.25],
    [root * 0.8, root, root * 1.33],
    [root * 0.9, root * 1.12, root * 1.4],
  ];

  const melodyNotes = [root, root * 1.125, root * 1.25, root * 1.33, root * 1.5, root * 1.75, root * 2];

  return {
    bpm,
    rootFreq: root,
    chords,
    melodyNotes,
    genre: (bpm > 120 ? 'synthwave' : bpm > 100 ? 'pop' : 'lofi') as any,
  };
}

export function parseTrackInfoFromUrl(url: string): {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  source: SourcePlatform;
  duration: number;
} {
  // Check against our catalog of quick demos first
  const match = QUICK_DEMO_LINKS.find((d) => url.toLowerCase().includes(d.url.toLowerCase()) || url.toLowerCase().includes(d.name.toLowerCase()));
  if (match) {
    return {
      title: match.name,
      artist: match.artist,
      album: `${match.name} - Single`,
      coverUrl: match.cover,
      source: match.platform.toLowerCase().includes('spotify') ? 'spotify' : match.platform.toLowerCase().includes('youtube') ? 'youtube' : 'soundcloud',
      duration: match.duration,
    };
  }

  // URL parsing heuristics
  let source: SourcePlatform = 'spotify';
  if (url.includes('music.youtube.com') || url.includes('youtube.com') || url.includes('youtu.be')) {
    source = 'youtube';
  } else if (url.includes('soundcloud.com')) {
    source = 'soundcloud';
  }

  // Generate plausible track name from slug
  try {
    const parts = url.split('/').filter(Boolean);
    const lastPart = decodeURIComponent(parts[parts.length - 1] || 'Track').replace(/[\?#].*$/, '').replace(/[-_]/g, ' ');
    const title = lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    return {
      title: title || 'Downloaded Track',
      artist: source === 'spotify' ? 'Spotify Artist' : source === 'youtube' ? 'YouTube Artist' : 'SoundCloud Creator',
      album: 'Downtify Local Vault',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      source,
      duration: 215,
    };
  } catch {
    return {
      title: 'Imported Track',
      artist: 'Unknown Artist',
      album: 'Downtify Local Vault',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
      source: 'spotify',
      duration: 195,
    };
  }
}

export function createDownloadJob(
  url: string,
  format: AudioFormat,
  bitrate: BitrateOption
): DownloadJob {
  const info = parseTrackInfoFromUrl(url);
  const sizeMap: Record<AudioFormat, number> = {
    flac: 26.4,
    mp3: 8.8,
    m4a: 7.2,
    opus: 5.4,
    ogg: 7.0,
  };

  return {
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    url,
    title: info.title,
    artist: info.artist,
    album: info.album,
    coverUrl: info.coverUrl,
    progress: 5,
    status: 'fetching_embed',
    stageLabel: 'Resolving Spotify public embed metadata...',
    format,
    bitrate,
    etaSeconds: 4,
    fileSizeMb: sizeMap[format] || 8.5,
    sourcePlatform: info.source,
  };
}

export function buildCompletedTrack(job: DownloadJob): Track {
  const info = parseTrackInfoFromUrl(job.url);

  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: job.title || info.title,
    artist: job.artist || info.artist,
    album: job.album || info.album,
    releaseYear: new Date().getFullYear().toString(),
    trackNumber: 1,
    genre: 'Electronic / Pop',
    duration: info.duration,
    coverUrl: job.coverUrl || info.coverUrl,
    source: job.sourcePlatform,
    sourceUrl: job.url,
    format: job.format,
    bitrate: job.bitrate,
    fileSizeMb: job.fileSizeMb,
    downloadedAt: Date.now(),
    isrc: `DOWNTIFY${Date.now().toString().slice(-6)}`,
    synthConfig: generateSynthForTrack(job.title, job.artist),
    lyrics: [
      { time: 0, text: `[${job.title} - ${job.artist}]` },
      { time: 10, text: 'Playing downloaded audio tagged with Downtify' },
      { time: 20, text: `Format: ${job.format.toUpperCase()} · Bitrate: ${job.bitrate}` },
      { time: 35, text: 'Time-synced lyrics delivered via LRCLIB integration' },
      { time: 55, text: 'Full ID3v2 tags and cover art embedded with mutagen' },
      { time: 80, text: 'High fidelity audio offline playback' },
      { time: 110, text: 'Stream continues without any ads or interruptions' },
      { time: 140, text: `Enjoy your local music library · ${job.title}` },
    ],
  };
}
