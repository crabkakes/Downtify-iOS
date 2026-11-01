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
  Heart,
  ArrowDownCircle,
  WifiOff,
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
  onToggleLike: (trackId: string) => void;
  onToggleCacheOffline: (trackId: string) => void;
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
  onToggleLike,
  onToggleCacheOffline,
}) => {
  const [activeSegment, setActiveSegment] = useState<'all' | 'liked' | 'playlists' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist' | 'size'>('recent');
  const [selectedTrackMenu, setSelectedTrackMenu] = useState<Track | null>(null);
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Filter based on segment and search
  const filteredTracks = tracks.filter((t) => {
    if (activeSegment === 'liked' && !t.isLiked) return false;
    if (activeSegment === 'offline' && !t.isOfflineCached) return false;

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

  const likedTracks = tracks.filter((t) => t.isLiked);
  const offlineTracks = tracks.filter((t) => t.isOfflineCached);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* iOS Top Bar */}
      <div className="px-5 pt-3 pb-2 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white">Your Library</h1>
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

        {/* Filter Chips / Segmented Control */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveSegment('all');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeSegment === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All ({tracks.length})
          </button>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveSegment('liked');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeSegment === 'liked'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Liked ({likedTracks.length})
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
              setActiveSegment('offline');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeSegment === 'offline'
                ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Offline ({offlineTracks.length})
          </button>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="recent">Recent</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-28 pt-2 space-y-3">
        {/* Liked Songs Special Banner when in "All" view */}
        {activeSegment === 'all' && (
          <div
            onClick={() => {
              audioEngine.playHapticClick();
              if (likedTracks[0]) onPlayTrack(likedTracks[0]);
            }}
            className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-neutral-900 border border-indigo-500/20 cursor-pointer hover:border-indigo-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shrink-0">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white">Liked Songs</h3>
              <p className="text-xs text-neutral-400">{likedTracks.length} tracks favorited on server</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (likedTracks[0]) onPlayTrack(likedTracks[0]);
              }}
              className="p-2 rounded-full bg-emerald-500 text-neutral-950 shadow"
            >
              <Play className="w-4 h-4 fill-neutral-950 ml-0.5" />
            </button>
          </div>
        )}

        {/* PLAYLISTS VIEW */}
        {activeSegment === 'playlists' ? (
          <div className="space-y-3">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  const firstTrack = tracks.find((t) => pl.trackIds.includes(t.id));
                  if (firstTrack) onPlayTrack(firstTrack);
                }}
                className="flex items-center gap-3 p-2.5 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-2xl cursor-pointer transition-all"
              >
                <img src={pl.coverUrl} alt={pl.name} className="w-12 h-12 rounded-xl object-cover shrink-0 shadow" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white truncate">{pl.name}</h4>
                  <p className="text-xs text-neutral-400 truncate">{pl.description}</p>
                  <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{pl.trackIds.length} tracks</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMonitorPlaylist(pl.id);
                  }}
                  className={`p-1.5 rounded-lg text-xs ${
                    pl.monitored ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-500 hover:text-white'
                  }`}
                  title={pl.monitored ? 'Server is monitoring this playlist' : 'Watch playlist'}
                >
                  <Radio className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* TRACKS LIST */
          <div className="space-y-1">
            {filteredTracks.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tracks found</p>
                {activeSegment === 'offline' && (
                  <p className="text-xs text-neutral-600 mt-1">Tap the arrow icon on any track to cache it for offline listening.</p>
                )}
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
                          <span>{track.fileSizeMb} MB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      {/* Offline Cache Download Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          audioEngine.playHapticClick();
                          onToggleCacheOffline(track.id);
                        }}
                        title={track.isOfflineCached ? 'Cached offline on iPhone' : 'Cache for offline listening'}
                        className="p-1.5 text-neutral-400 hover:text-white"
                      >
                        <ArrowDownCircle
                          className={`w-4 h-4 ${
                            track.isOfflineCached ? 'text-emerald-400 fill-emerald-500/20' : 'text-neutral-500'
                          }`}
                        />
                      </button>

                      {/* Like Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          audioEngine.playHapticClick();
                          onToggleLike(track.id);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-white"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            track.isLiked ? 'text-emerald-400 fill-emerald-400' : 'text-neutral-500'
                          }`}
                        />
                      </button>

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
      </div>

      {/* Track Menu Sheet */}
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
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    onPlayTrack(selectedTrackMenu);
                    setSelectedTrackMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-xs font-medium text-white"
                >
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>Play Track</span>
                </button>

                <button
                  onClick={() => {
                    onToggleCacheOffline(selectedTrackMenu.id);
                    setSelectedTrackMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-xs font-medium text-white"
                >
                  <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                  <span>{selectedTrackMenu.isOfflineCached ? 'Remove from Offline Storage' : 'Download to Device'}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenTagEditor(selectedTrackMenu);
                    setSelectedTrackMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-xs font-medium text-white"
                >
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span>Inspect ID3v2 Tags & Cover</span>
                </button>

                <button
                  onClick={() => {
                    onDeleteTrack(selectedTrackMenu.id);
                    setSelectedTrackMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-xs font-medium text-red-400"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Delete from Downtify Server</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedTrackMenu(null)}
                className="w-full py-2.5 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-medium"
              >
                Cancel
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
              <h3 className="text-base font-semibold text-white">New Playlist on Server</h3>
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
