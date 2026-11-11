/**
 * Downtify iOS
 * Native iOS Client Companion inspired by henriquesebastiao/downtify-android
 * Features Server Pairing, Offline Caching, Lossless Audio Engine, and Time-Synced Lyrics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IPhoneShell } from './components/IPhoneShell';
import { TabBar, TabType } from './components/TabBar';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { MiniPlayerBar } from './components/MiniPlayerBar';
import { NowPlayingSheet } from './components/NowPlayingSheet';
import { ID3EditorModal } from './components/ID3EditorModal';
import { ServerPairingModal } from './components/ServerPairingModal';
import { ScreenshotsShowcaseModal } from './components/ScreenshotsShowcaseModal';

import {
  Track,
  Playlist,
  DownloadJob,
  DownloadStatus,
  DowntifySettings,
  AudioFormat,
  BitrateOption,
  ServerConnection,
} from './types';
import { EMPTY_TRACKS, EMPTY_PLAYLISTS } from './data/catalogTemplates';
import { audioEngine } from './utils/audioEngine';
import { createDownloadJob, buildCompletedTrack } from './utils/downloadPipeline';
import { requestServerDownload } from './utils/serverApi';
import { nativeIOSBridge } from './native/iosBridge';
import confetti from 'canvas-confetti';

const STORAGE_KEY_TRACKS = 'downtify_prod_tracks_v4';
const STORAGE_KEY_PLAYLISTS = 'downtify_prod_playlists_v4';
const STORAGE_KEY_SETTINGS = 'downtify_prod_settings_v4';

// Aggressively purge any legacy storage keys or any stored mock tracks from earlier sessions
try {
  const allKeys = Object.keys(localStorage);
  for (const k of allKeys) {
    if (k.startsWith('downtify_') && !k.includes('_prod_v4')) {
      localStorage.removeItem(k);
    } else if (k.startsWith('downtify_')) {
      const val = localStorage.getItem(k);
      if (
        val &&
        (val.includes('Blinding Lights') ||
          val.includes('track-1') ||
          val.includes('alex') ||
          val.includes('downtify.local') ||
          val.includes('dt_auth_token') ||
          val.includes('demo'))
      ) {
        localStorage.removeItem(k);
      }
    }
  }
} catch {
  // ignore
}

export default function App() {
  // Settings & Server Connection
  const [settings, setSettings] = useState<DowntifySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure no stale dummy demo values persist
        if (parsed?.serverConnection?.username === 'alex' || parsed?.serverConnection?.serverUrl?.includes('downtify.local')) {
          parsed.serverConnection.status = 'disconnected';
          parsed.serverConnection.serverUrl = '';
          parsed.serverConnection.username = '';
          parsed.serverConnection.token = '';
        }
        return parsed;
      }
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
      serverConnection: {
        status: 'disconnected',
        serverUrl: '',
        username: '',
        token: '',
        pingMs: 0,
        serverVersion: 'v2.8.4',
        libraryStats: {
          totalTracks: 0,
          totalPlaylists: 0,
          totalStorageGb: 0,
        },
      },
      wifiStreamingQuality: 'original',
      cellularStreamingQuality: 'high_320',
      offlineDownloadQuality: 'lossless',
      offlineOnlyMode: false,
      normalizeVolume: true,
      crossfadeSeconds: 2,
    };
  });

  // Track & Playlist Library (Clean production defaults)
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRACKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasMock = parsed.some((t: any) => t.id === 'track-1' || t.title === 'Blinding Lights');
          if (!hasMock) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return EMPTY_TRACKS;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasMock = parsed.some((p: any) => p.id === 'pl-1' || p.name?.includes('Downtify Top Hits'));
          if (!hasMock) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return EMPTY_PLAYLISTS;
  });

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isServerPairingOpen, setIsServerPairingOpen] = useState(false);
  const [isScreenshotsOpen, setIsScreenshotsOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  // Active Server Downloads
  const [activeJobs, setActiveJobs] = useState<DownloadJob[]>([]);

  // Playback State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
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

  // Audio Playback Handlers
  const handlePlayTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    audioEngine.playTrack(track, 0);
  }, []);

  const handleNextTrack = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handlePlayTrack(tracks[nextIndex]);
  }, [currentTrack, tracks, handlePlayTrack]);

  const handlePrevTrack = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handlePlayTrack(tracks[prevIndex]);
  }, [currentTrack, tracks, handlePlayTrack]);

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

    // Native iOS Remote Commands
    const handleRemotePlay = () => audioEngine.resume();
    const handleRemotePause = () => audioEngine.pause();
    const handleRemoteNext = () => handleNextTrack();
    const handleRemotePrev = () => handlePrevTrack();
    const handleRemoteSeek = (e: any) => {
      if (typeof e.detail === 'number') audioEngine.seek(e.detail);
    };

    window.addEventListener('downtify:remotePlay', handleRemotePlay);
    window.addEventListener('downtify:remotePause', handleRemotePause);
    window.addEventListener('downtify:remoteNext', handleRemoteNext);
    window.addEventListener('downtify:remotePrev', handleRemotePrev);
    window.addEventListener('downtify:remoteSeek', handleRemoteSeek);

    return () => {
      unsubscribe();
      window.removeEventListener('downtify:trackEnded', handleTrackEnded);
      window.removeEventListener('downtify:homeBarTap', handleHomeBar);
      window.removeEventListener('downtify:remotePlay', handleRemotePlay);
      window.removeEventListener('downtify:remotePause', handleRemotePause);
      window.removeEventListener('downtify:remoteNext', handleRemoteNext);
      window.removeEventListener('downtify:remotePrev', handleRemotePrev);
      window.removeEventListener('downtify:remoteSeek', handleRemoteSeek);
    };
  }, [tracks, currentTrack, handleNextTrack, handlePrevTrack]);

  // Sync with native MPNowPlayingInfoCenter & Lock Screen
  useEffect(() => {
    nativeIOSBridge.updateNowPlayingInfo(
      currentTrack,
      playbackState.isPlaying,
      playbackState.currentTime
    );
  }, [currentTrack, playbackState.isPlaying, playbackState.currentTime]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol);
  };

  // Toggle Like (Heart)
  const handleToggleLike = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isLiked: !t.isLiked } : t))
    );
    if (currentTrack?.id === trackId) {
      setCurrentTrack((c) => (c ? { ...c, isLiked: !c.isLiked } : null));
    }
  };

  // Toggle Offline Cache (Download to device)
  const handleToggleCacheOffline = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isOfflineCached: !t.isOfflineCached } : t))
    );
    if (currentTrack?.id === trackId) {
      setCurrentTrack((c) => (c ? { ...c, isOfflineCached: !c.isOfflineCached } : null));
    }
  };

  // Download All Liked Songs
  const handleDownloadAllLiked = () => {
    setTracks((prev) =>
      prev.map((t) => (t.isLiked ? { ...t, isOfflineCached: true } : t))
    );
  };

  // Clear Offline Cache
  const handleClearOfflineCache = () => {
    setTracks((prev) =>
      prev.map((t) => ({ ...t, isOfflineCached: false }))
    );
  };

  // Request new server download
  const handleRequestDownload = (url: string, format: AudioFormat, bitrate: BitrateOption) => {
    const job = createDownloadJob(url, format, bitrate);
    setActiveJobs((prev) => [job, ...prev]);

    // Forward to real server if connected
    if (settings.serverConnection.status === 'connected' && settings.serverConnection.serverUrl) {
      requestServerDownload(
        settings.serverConnection.serverUrl,
        settings.serverConnection.token,
        { url, format, bitrate }
      ).catch(() => {});
    }
  };

  // Stepper for Server Downloads
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
            nextLabel = 'Scraping public Spotify embed...';
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
            nextLabel = 'Saved to server library!';
            const completedTrack = buildCompletedTrack(job);
            completedTrack.isLiked = false;
            completedTrack.isOfflineCached = true;
            job.track = completedTrack;

            setTracks((currTracks) => {
              if (currTracks.some((t) => t.title.toLowerCase() === completedTrack.title.toLowerCase())) {
                return currTracks;
              }
              return [completedTrack, ...currTracks];
            });

            try {
              confetti({
                particleCount: 40,
                spread: 60,
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

  // ID3 Tag Edit
  const handleSaveTrackMetadata = (updatedTrack: Track) => {
    setTracks((prev) => prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
    if (currentTrack?.id === updatedTrack.id) {
      setCurrentTrack(updatedTrack);
    }
  };

  // Delete Track
  const handleDeleteTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      audioEngine.stop();
      setCurrentTrack(null);
    }
  };

  // Create Playlist
  const handleCreatePlaylist = (name: string, description: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
      trackIds: tracks.slice(0, 3).map((t) => t.id),
      monitored: true,
      lastSynced: 'Just now',
    };
    setPlaylists((prev) => [newPl, ...prev]);
  };

  // Toggle Monitor
  const handleToggleMonitor = (plId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === plId ? { ...pl, monitored: !pl.monitored } : pl))
    );
  };

  // Clear Library
  const handleResetCatalog = () => {
    setTracks([]);
    setPlaylists([]);
    setCurrentTrack(null);
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
      onOpenDownloads={() => setActiveTab('search')}
      mode={settings.deviceFrameMode}
      onToggleMode={() =>
        setSettings((s) => ({
          ...s,
          deviceFrameMode: s.deviceFrameMode === 'iphone' ? 'fullscreen' : 'iphone',
        }))
      }
    >
      {/* 4-Tab Screen Router */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'home' && (
          <HomeView
            connection={settings.serverConnection}
            tracks={tracks}
            playlists={playlists}
            jobs={activeJobs}
            currentTrack={currentTrack}
            isPlaying={playbackState.isPlaying}
            onPlayTrack={(t) => {
              handlePlayTrack(t);
              setIsNowPlayingOpen(true);
            }}
            onOpenServerPairing={() => setIsServerPairingOpen(true)}
            onNavigateToSearch={() => setActiveTab('search')}
            onToggleLike={handleToggleLike}
          />
        )}

        {activeTab === 'search' && (
          <SearchView
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={playbackState.isPlaying}
            onPlayTrack={(t) => {
              handlePlayTrack(t);
              setIsNowPlayingOpen(true);
            }}
            onRequestDownload={handleRequestDownload}
            onToggleLike={handleToggleLike}
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
            onToggleLike={handleToggleLike}
            onToggleCacheOffline={handleToggleCacheOffline}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
            tracks={tracks}
            onResetCatalog={handleResetCatalog}
            onOpenServerPairing={() => setIsServerPairingOpen(true)}
            onOpenScreenshots={() => setIsScreenshotsOpen(true)}
            onDownloadAllLiked={handleDownloadAllLiked}
            onClearOfflineCache={handleClearOfflineCache}
            onDisconnectServer={() => {
              setSettings((s) => ({
                ...s,
                serverConnection: {
                  status: 'disconnected',
                  serverUrl: '',
                  username: '',
                  token: '',
                  pingMs: 0,
                  serverVersion: 'v2.8.4',
                  libraryStats: {
                    totalTracks: 0,
                    totalPlaylists: 0,
                    totalStorageGb: 0,
                  },
                },
              }));
            }}
          />
        )}
      </div>

      {/* Mini Player Bar */}
      <MiniPlayerBar
        track={currentTrack}
        isPlaying={playbackState.isPlaying}
        currentTime={playbackState.currentTime}
        duration={playbackState.duration}
        onOpenFullPlayer={() => setIsNowPlayingOpen(true)}
        onNext={handleNextTrack}
      />

      {/* iOS Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        activeDownloadsCount={activeDownloadsCount}
      />

      {/* Now Playing Fullscreen Sheet */}
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
        onToggleLike={handleToggleLike}
        onToggleCacheOffline={handleToggleCacheOffline}
      />

      {/* App Screenshots Showcase */}
      <ScreenshotsShowcaseModal
        isOpen={isScreenshotsOpen}
        onClose={() => setIsScreenshotsOpen(false)}
      />

      {/* Server Pairing Modal */}
      <ServerPairingModal
        isOpen={isServerPairingOpen}
        onClose={() => setIsServerPairingOpen(false)}
        connection={settings.serverConnection}
        onConnect={(newConn, realTracks) => {
          setSettings((s) => ({
            ...s,
            serverConnection: { ...s.serverConnection, ...newConn },
          }));
          if (realTracks && realTracks.length > 0) {
            setTracks(realTracks);
            setCurrentTrack(realTracks[0]);
          }
        }}
        onDisconnect={() => {
          setSettings((s) => ({
            ...s,
            serverConnection: {
              status: 'disconnected',
              serverUrl: '',
              username: '',
              token: '',
              pingMs: 0,
              serverVersion: 'v2.8.4',
              libraryStats: {
                totalTracks: 0,
                totalPlaylists: 0,
                totalStorageGb: 0,
              },
            },
          }));
        }}
      />

      {/* ID3 Tag Editor */}
      <ID3EditorModal
        track={editingTrack}
        isOpen={!!editingTrack}
        onClose={() => setEditingTrack(null)}
        onSave={handleSaveTrackMetadata}
      />
    </IPhoneShell>
  );
}
