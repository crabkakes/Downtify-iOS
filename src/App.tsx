/**
 * Downtify iOS
 * Native iOS music downloader and offline player inspired by Henrique Sebastião's Downtify.
 * Converts Spotify, YouTube Music, and SoundCloud links into tagged audio with time-synced lyrics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IPhoneShell } from './components/IPhoneShell';
import { TabBar, TabType } from './components/TabBar';
import { DownloaderView } from './components/DownloaderView';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { MiniPlayerBar } from './components/MiniPlayerBar';
import { NowPlayingSheet } from './components/NowPlayingSheet';
import { ID3EditorModal } from './components/ID3EditorModal';

import { Track, Playlist, DownloadJob, DownloadStatus, DowntifySettings, AudioFormat, BitrateOption } from './types';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS } from './data/mockCatalog';
import { audioEngine } from './utils/audioEngine';
import { createDownloadJob, buildCompletedTrack } from './utils/downloadPipeline';
import confetti from 'canvas-confetti';

const STORAGE_KEY_TRACKS = 'downtify_ios_tracks_v1';
const STORAGE_KEY_PLAYLISTS = 'downtify_ios_playlists_v1';
const STORAGE_KEY_SETTINGS = 'downtify_ios_settings_v1';

export default function App() {
  // Settings
  const [settings, setSettings] = useState<DowntifySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      defaultFormat: 'flac',
      defaultBitrate: 'lossless',
      namingPattern: '{artist}/{album}/{track_number} - {title}',
      fetchLyrics: true,
      embedCoverArt: true,
      autoSyncMonitored: true,
      deviceFrameMode: 'iphone',
      hapticsEnabled: true,
      storageLimitMb: 1024,
    };
  });

  // Track & Playlist Library
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRACKS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TRACKS;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_PLAYLISTS;
  });

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<TabType>('downloader');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  // Active Downloads
  const [activeJobs, setActiveJobs] = useState<DownloadJob[]>([]);

  // Audio Playback State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: INITIAL_TRACKS[0]?.duration || 180,
  });
  const [volume, setVolume] = useState(0.85);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRACKS, JSON.stringify(tracks));
    } catch {
      // ignore
    }
  }, [tracks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
    } catch {
      // ignore
    }
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Subscribe to audio engine
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((st) => {
      setPlaybackState(st);
    });

    const handleTrackEnded = () => {
      handleNextTrack();
    };

    const handleHomeBar = () => {
      setIsNowPlayingOpen(false);
      setEditingTrack(null);
    };

    window.addEventListener('downtify:trackEnded', handleTrackEnded);
    window.addEventListener('downtify:homeBarTap', handleHomeBar);

    return () => {
      unsubscribe();
      window.removeEventListener('downtify:trackEnded', handleTrackEnded);
      window.removeEventListener('downtify:homeBarTap', handleHomeBar);
    };
  }, [tracks, currentTrack]);

  // Update volume in audio engine
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol);
  };

  // Play track handler
  const handlePlayTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    audioEngine.playTrack(track, 0);
  }, []);

  // Next track in queue
  const handleNextTrack = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handlePlayTrack(tracks[nextIndex]);
  }, [currentTrack, tracks, handlePlayTrack]);

  // Previous track in queue
  const handlePrevTrack = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handlePlayTrack(tracks[prevIndex]);
  }, [currentTrack, tracks, handlePlayTrack]);

  // Start new download job
  const handleStartDownload = (url: string, format: AudioFormat, bitrate: BitrateOption) => {
    const job = createDownloadJob(url, format, bitrate);
    setActiveJobs((prev) => [job, ...prev]);
  };

  // Import custom local audio file
  const handleImportCustomAudio = (file: File) => {
    const url = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const newTrack: Track = {
      id: `local-${Date.now()}`,
      title: cleanName,
      artist: 'Local Import',
      album: 'Imported Media',
      releaseYear: new Date().getFullYear().toString(),
      trackNumber: 1,
      genre: 'Local Audio',
      duration: 180,
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      source: 'local',
      format: (file.name.split('.').pop() as any) || 'mp3',
      bitrate: '320k',
      fileSizeMb: parseFloat((file.size / (1024 * 1024)).toFixed(1)),
      downloadedAt: Date.now(),
      customAudioUrl: url,
      lyrics: [
        { time: 0, text: `[Playing: ${file.name}]` },
        { time: 10, text: 'Custom local audio file decoded in Downtify iOS' },
        { time: 30, text: 'Metadata and playback managed in browser storage' },
      ],
    };

    setTracks((prev) => [newTrack, ...prev]);
    handlePlayTrack(newTrack);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  // Batch queue from CSV
  const handleBatchQueueCsv = (csvText: string) => {
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    // skip header if present
    const rows = lines.slice(lines[0]?.toLowerCase().includes('artist') ? 1 : 0);

    const newJobs: DownloadJob[] = [];
    rows.slice(0, 8).forEach((line, idx) => {
      const parts = line.split(',');
      const artist = parts[1]?.trim() || 'Various Artists';
      const title = parts[2]?.trim() || `Track #${idx + 1}`;
      const fakeUrl = `https://open.spotify.com/track/csv_${idx}_${encodeURIComponent(title)}`;
      const job = createDownloadJob(fakeUrl, settings.defaultFormat, settings.defaultBitrate);
      job.title = title;
      job.artist = artist;
      newJobs.push(job);
    });

    if (newJobs.length > 0) {
      setActiveJobs((prev) => [...newJobs, ...prev]);
      setActiveTab('downloader');
    }
  };

  // Download Pipeline Engine (Stepper)
  useEffect(() => {
    if (activeJobs.length === 0) return;

    const interval = setInterval(() => {
      setActiveJobs((prevJobs) => {
        let changed = false;
        const updated = prevJobs.map((job) => {
          if (job.status === 'completed' || job.status === 'failed') {
            return job;
          }

          changed = true;
          const nextProgress = Math.min(100, job.progress + 15);

          let nextStatus: DownloadStatus = job.status;
          let nextLabel = job.stageLabel;

          if (nextProgress < 25) {
            nextStatus = 'fetching_embed';
            nextLabel = 'Scraping Spotify public embed...';
          } else if (nextProgress < 50) {
            nextStatus = 'matching_ytm';
            nextLabel = 'Matching duration via ytmusicapi...';
          } else if (nextProgress < 75) {
            nextStatus = 'extracting_audio';
            nextLabel = 'Extracting high-rate stream with yt-dlp...';
          } else if (nextProgress < 90) {
            nextStatus = 'transcoding';
            nextLabel = `Transcoding ffmpeg (${job.format} @ ${job.bitrate})...`;
          } else if (nextProgress < 100) {
            nextStatus = 'embedding_tags';
            nextLabel = 'Fetching LRCLIB lyrics & mutagen tagging...';
          } else {
            nextStatus = 'completed';
            nextLabel = 'Saved to offline library!';
            const completedTrack = buildCompletedTrack(job);
            job.track = completedTrack;

            // Add track to library
            setTracks((currTracks) => {
              if (currTracks.some((t) => t.title.toLowerCase() === completedTrack.title.toLowerCase())) {
                return currTracks;
              }
              return [completedTrack, ...currTracks];
            });

            // Trigger celebration
            try {
              confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {
              // ignore
            }
          }

          return {
            ...job,
            progress: nextProgress,
            status: nextStatus,
            stageLabel: nextLabel,
          };
        });

        return changed ? updated : prevJobs;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [activeJobs]);

  // ID3 tag update handler
  const handleSaveTrackMetadata = (updatedTrack: Track) => {
    setTracks((prev) => prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
    if (currentTrack?.id === updatedTrack.id) {
      setCurrentTrack(updatedTrack);
    }
  };

  // Delete track handler
  const handleDeleteTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      audioEngine.stop();
      setCurrentTrack(null);
    }
  };

  // Create playlist
  const handleCreatePlaylist = (name: string, description: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      trackIds: tracks.slice(0, 3).map((t) => t.id),
      monitored: true,
      lastSynced: 'Just now',
    };
    setPlaylists((prev) => [newPl, ...prev]);
  };

  // Toggle monitored playlist
  const handleToggleMonitor = (plId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === plId ? { ...pl, monitored: !pl.monitored } : pl))
    );
  };

  // Reset catalog
  const handleResetCatalog = () => {
    setTracks(INITIAL_TRACKS);
    setPlaylists(INITIAL_PLAYLISTS);
    setCurrentTrack(INITIAL_TRACKS[0]);
    audioEngine.stop();
  };

  const activeDownloadsCount = activeJobs.filter(
    (j) => j.status !== 'completed' && j.status !== 'failed'
  ).length;

  const activeJobForIsland = activeJobs.find(
    (j) => j.status !== 'completed' && j.status !== 'failed'
  ) || null;

  return (
    <IPhoneShell
      currentTrack={currentTrack}
      isPlaying={playbackState.isPlaying}
      activeJob={activeJobForIsland}
      volume={volume}
      onVolumeChange={handleVolumeChange}
      onOpenPlayer={() => setIsNowPlayingOpen(true)}
      onOpenDownloads={() => setActiveTab('downloader')}
      mode={settings.deviceFrameMode}
      onToggleMode={() =>
        setSettings((s) => ({
          ...s,
          deviceFrameMode: s.deviceFrameMode === 'iphone' ? 'fullscreen' : 'iphone',
        }))
      }
    >
      {/* Tab Screen Router */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'downloader' && (
          <DownloaderView
            jobs={activeJobs}
            onStartDownload={handleStartDownload}
            onImportCustomAudio={handleImportCustomAudio}
            onBatchQueueCsv={handleBatchQueueCsv}
            onPlayTrack={(t) => {
              handlePlayTrack(t);
              setIsNowPlayingOpen(true);
            }}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            tracks={tracks}
            playlists={playlists}
            currentTrack={currentTrack}
            isPlaying={playbackState.isPlaying}
            onPlayTrack={handlePlayTrack}
            onOpenTagEditor={(t) => setEditingTrack(t)}
            onDeleteTrack={handleDeleteTrack}
            onCreatePlaylist={handleCreatePlaylist}
            onToggleMonitorPlaylist={handleToggleMonitor}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
            tracks={tracks}
            onResetCatalog={handleResetCatalog}
          />
        )}
      </div>

      {/* Mini Player Bar (Persistent above TabBar) */}
      <MiniPlayerBar
        track={currentTrack}
        isPlaying={playbackState.isPlaying}
        currentTime={playbackState.currentTime}
        duration={playbackState.duration}
        onOpenFullPlayer={() => setIsNowPlayingOpen(true)}
        onNext={handleNextTrack}
      />

      {/* Bottom Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        activeDownloadsCount={activeDownloadsCount}
      />

      {/* Fullscreen Now Playing Sheet */}
      <NowPlayingSheet
        track={currentTrack}
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        isPlaying={playbackState.isPlaying}
        currentTime={playbackState.currentTime}
        duration={playbackState.duration}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        queue={tracks}
        onOpenTagEditor={(t) => setEditingTrack(t)}
      />

      {/* ID3 Tag Editor Modal */}
      <ID3EditorModal
        track={editingTrack}
        isOpen={!!editingTrack}
        onClose={() => setEditingTrack(null)}
        onSave={handleSaveTrackMetadata}
      />
    </IPhoneShell>
  );
}
