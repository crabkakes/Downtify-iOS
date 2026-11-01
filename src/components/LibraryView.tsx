import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Music,
  ListMusic,
  Disc,
  HardDrive,
  Play,
  MoreVertical,
  Check,
  Tag,
  Trash2,
  Share2,
  FolderArchive,
  RefreshCw,
  Plus,
  Radio,
  FileAudio,
} from 'lucide-react';
import { Track, Playlist, AudioFormat } from '../types';
import { audioEngine } from '../utils/audioEngine';
import JSZip from 'jszip';

interface LibraryViewProps {
  tracks: Track[];
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onOpenTagEditor: (track: Track) => void;
  onDeleteTrack: (trackId: string) => void;
  onCreatePlaylist: (name: string, description: string) => void;
  onToggleMonitorPlaylist: (playlistId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  playlists,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenTagEditor,
  onDeleteTrack,
  onCreatePlaylist,
  onToggleMonitorPlaylist,
}) => {
  const [activeSegment, setActiveSegment] = useState<'tracks' | 'playlists' | 'albums' | 'storage'>('tracks');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist' | 'size'>('recent');
  const [selectedTrackMenu, setSelectedTrackMenu] = useState<Track | null>(null);
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Filter & sort tracks
  const filteredTracks = tracks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'size') return b.fileSizeMb - a.fileSizeMb;
    return b.downloadedAt - a.downloadedAt;
  });

  // Calculate storage stats
  const totalStorageMb = tracks.reduce((acc, t) => acc + t.fileSizeMb, 0);
  const formatBreakdown: Record<AudioFormat, number> = {
    mp3: 0,
    flac: 0,
    m4a: 0,
    ogg: 0,
    opus: 0,
  };
  tracks.forEach((t) => {
    formatBreakdown[t.format] = (formatBreakdown[t.format] || 0) + t.fileSizeMb;
  });

  // Unique albums
  const albumMap = new Map<string, { name: string; artist: string; year: string; cover: string; tracks: Track[] }>();
  tracks.forEach((t) => {
    const key = `${t.album}-${t.artist}`;
    if (!albumMap.has(key)) {
      albumMap.set(key, {
        name: t.album,
        artist: t.artist,
        year: t.releaseYear,
        cover: t.coverUrl,
        tracks: [],
      });
    }
    albumMap.get(key)!.tracks.push(t);
  });
  const albums = Array.from(albumMap.values());

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Export full library as ZIP with M3U playlist file
  const handleExportAllZip = async () => {
    audioEngine.playHapticClick();
    setIsExportingZip(true);
    try {
      const zip = new JSZip();

      // Create M3U playlist file
      let m3uContent = '#EXTM3U\n# Downtify Exported Playlist for Plex / Jellyfin / Navidrome\n';
      tracks.forEach((t) => {
        m3uContent += `#EXTINF:${Math.round(t.duration)},${t.artist} - ${t.title}\n`;
        m3uContent += `${t.artist}/${t.album}/${t.trackNumber} - ${t.title}.${t.format}\n`;
      });
      zip.file('downtify_library.m3u', m3uContent);

      // Create metadata index JSON
      zip.file(
        'downtify_metadata.json',
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            totalTracks: tracks.length,
            totalSizeMb: totalStorageMb.toFixed(2),
            tracks,
            playlists,
          },
          null,
          2
        )
      );

      // Add dummy audio placeholders / tagged descriptors for each song
      const musicFolder = zip.folder('Music');
      tracks.forEach((t) => {
        const info = `Title: ${t.title}\nArtist: ${t.artist}\nAlbum: ${t.album}\nYear: ${t.releaseYear}\nGenre: ${t.genre}\nISRC: ${t.isrc || 'N/A'}\nFormat: ${t.format} (${t.bitrate})\n\n[Synchronized Lyrics / LRCLIB]:\n` +
          t.lyrics.map(l => `[${Math.floor(l.time / 60)}:${Math.floor(l.time % 60)}] ${l.text}`).join('\n');
        musicFolder?.file(`${t.artist} - ${t.title}.id3_tagged.txt`, info);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `downtify_library_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* iOS Top Bar */}
      <div className="px-5 pt-4 pb-2 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white">Library</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioEngine.playHapticClick();
                setShowNewPlaylistModal(true);
              }}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
              title="New Playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* iOS Segmented Control */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveSegment('tracks');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeSegment === 'tracks'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Tracks ({tracks.length})
          </button>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveSegment('playlists');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeSegment === 'playlists'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveSegment('albums');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeSegment === 'albums'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Albums
          </button>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveSegment('storage');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeSegment === 'storage'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Storage
          </button>
        </div>

        {/* Search & Sort Bar (Tracks, Playlists, Albums) */}
        {activeSegment !== 'storage' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search offline library..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {activeSegment === 'tracks' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
              >
                <option value="recent">Recent</option>
                <option value="title">Title</option>
                <option value="artist">Artist</option>
                <option value="size">File Size</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-28 pt-2">
        {/* TRACKS LIST */}
        {activeSegment === 'tracks' && (
          <div className="space-y-1">
            {filteredTracks.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tracks found</p>
              </div>
            ) : (
              filteredTracks.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      audioEngine.playHapticClick();
                      onPlayTrack(track);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all group ${
                      isCurrent
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'hover:bg-neutral-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            {isPlaying ? (
                              <div className="flex items-end gap-0.5 h-4">
                                <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.5s_infinite]" />
                                <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.7s_infinite_0.2s]" />
                                <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.4s_infinite_0.4s]" />
                              </div>
                            ) : (
                              <Play className="w-4 h-4 text-white fill-white" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-neutral-500 font-mono">
                          <span className="uppercase text-neutral-400">{track.format}</span>
                          <span>·</span>
                          <span>{track.bitrate}</span>
                          <span>·</span>
                          <span>{track.fileSizeMb} MB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      <span className="text-xs font-mono text-neutral-500">
                        {formatDuration(track.duration)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          audioEngine.playHapticClick();
                          setSelectedTrackMenu(track);
                        }}
                        className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PLAYLISTS TAB */}
        {activeSegment === 'playlists' && (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Playlist Monitoring: auto-downloads new tracks from embed</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={pl.coverUrl}
                      alt={pl.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">{pl.name}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-1">{pl.description}</p>
                      <p className="text-[11px] font-mono text-neutral-500 mt-1">
                        {pl.trackIds.length} tracks offline
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
                    <button
                      onClick={() => onToggleMonitorPlaylist(pl.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        pl.monitored
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      <Radio className="w-3 h-3" />
                      {pl.monitored ? 'Watching' : 'Watch Playlist'}
                    </button>

                    <button
                      onClick={() => {
                        const firstTrack = tracks.find((t) => pl.trackIds.includes(t.id));
                        if (firstTrack) onPlayTrack(firstTrack);
                      }}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 fill-emerald-400" />
                      Play
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALBUMS TAB */}
        {activeSegment === 'albums' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {albums.map((alb, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (alb.tracks[0]) onPlayTrack(alb.tracks[0]);
                }}
                className="p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-2xl cursor-pointer transition-all group"
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 relative">
                  <img src={alb.cover} alt={alb.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-7 h-7 text-white fill-white" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-white truncate">{alb.name}</p>
                <p className="text-xs text-neutral-400 truncate">{alb.artist}</p>
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  {alb.tracks.length} tracks · {alb.year}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* STORAGE & EXPORT TAB */}
        {activeSegment === 'storage' && (
          <div className="space-y-4">
            <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono uppercase text-neutral-400">Total Library Size</span>
                  <h3 className="text-3xl font-bold text-white mt-0.5">{totalStorageMb.toFixed(1)} MB</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                  <HardDrive className="w-6 h-6" />
                </div>
              </div>

              {/* Format progress bars */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Codec Distribution</span>
                  <span>{tracks.length} local files</span>
                </div>
                <div className="h-3 w-full bg-neutral-950 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${(formatBreakdown.flac / (totalStorageMb || 1)) * 100}%` }}
                    title="FLAC"
                  />
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${(formatBreakdown.mp3 / (totalStorageMb || 1)) * 100}%` }}
                    title="MP3"
                  />
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(formatBreakdown.m4a / (totalStorageMb || 1)) * 100}%` }}
                    title="M4A"
                  />
                  <div
                    className="h-full bg-teal-500"
                    style={{ width: `${(formatBreakdown.opus / (totalStorageMb || 1)) * 100}%` }}
                    title="OPUS"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1">
                  <span className="flex items-center gap-1.5 text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    FLAC ({formatBreakdown.flac.toFixed(1)} MB)
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    MP3 ({formatBreakdown.mp3.toFixed(1)} MB)
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    M4A ({formatBreakdown.m4a.toFixed(1)} MB)
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    OPUS ({formatBreakdown.opus.toFixed(1)} MB)
                  </span>
                </div>
              </div>

              {/* Export Library action */}
              <div className="pt-3 border-t border-neutral-800 flex flex-col gap-2">
                <button
                  onClick={handleExportAllZip}
                  disabled={isExportingZip}
                  className="w-full py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <FolderArchive className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isExportingZip ? 'Packaging Library...' : 'Export All as ZIP (with M3U & ID3)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Track Action Menu Modal */}
      <AnimatePresence>
        {selectedTrackMenu && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-3"
            >
              <div className="w-12 h-1.5 bg-neutral-700/80 rounded-full mx-auto mb-2 sm:hidden" />

              <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                <img
                  src={selectedTrackMenu.coverUrl}
                  alt={selectedTrackMenu.title}
                  className="w-12 h-12 rounded-xl object-cover shadow"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{selectedTrackMenu.title}</p>
                  <p className="text-xs text-neutral-400 truncate">{selectedTrackMenu.artist}</p>
                  <p className="text-[10px] font-mono text-emerald-400 uppercase mt-0.5">
                    {selectedTrackMenu.format} · {selectedTrackMenu.bitrate}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    onPlayTrack(selectedTrackMenu);
                    setSelectedTrackMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-xs font-medium text-white transition-colors"
                >
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>Play Track</span>
                </button>

                <button
                  onClick={() => {
                    onOpenTagEditor(selectedTrackMenu);
                    setSelectedTrackMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-xs font-medium text-white transition-colors"
                >
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span>Edit ID3v2 Tags & Cover (mutagen)</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedTrackMenu.sourceUrl) {
                      navigator.clipboard?.writeText(selectedTrackMenu.sourceUrl);
                    }
                    setSelectedTrackMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-xs font-medium text-white transition-colors"
                >
                  <Share2 className="w-4 h-4 text-neutral-400" />
                  <span>Copy Source URL</span>
                </button>

                <button
                  onClick={() => {
                    onDeleteTrack(selectedTrackMenu.id);
                    setSelectedTrackMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-xs font-medium text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Remove from Offline Library</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedTrackMenu(null)}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Playlist Modal */}
      <AnimatePresence>
        {showNewPlaylistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-semibold text-white">New Monitored Playlist</h3>
              <input
                type="text"
                placeholder="Playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewPlaylistModal(false)}
                  className="px-3 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newPlaylistName.trim()) {
                      onCreatePlaylist(newPlaylistName.trim(), 'Created on Downtify iOS');
                      setNewPlaylistName('');
                      setShowNewPlaylistModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 text-neutral-950 rounded-xl text-xs font-semibold"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
