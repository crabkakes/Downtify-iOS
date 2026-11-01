import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Heart,
  ListMusic,
  Home,
  Music2,
  Wifi,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface CarPlaySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  tracks: Track[];
  playlists: Playlist[];
  onPlayTrack: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const CarPlaySimulatorModal: React.FC<CarPlaySimulatorModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  tracks,
  playlists,
  onPlayTrack,
  onToggleLike,
  onNext,
  onPrev,
}) => {
  const [activeCarTab, setActiveCarTab] = useState<'nowPlaying' | 'home' | 'library'>('nowPlaying');

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const likedTracks = tracks.filter((t) => t.isLiked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-[36px] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
      >
        {/* Automotive Console Outer Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Apple CarPlay Automotive Dashboard</h3>
              <p className="text-[10px] text-neutral-400 font-mono">CPTemplateApplicationScene · CPTabBarTemplate</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 16:9 In-Vehicle Display Screen */}
        <div className="relative aspect-[16/9] w-full bg-black flex overflow-hidden select-none">
          {/* Left CarPlay System Dock */}
          <div className="w-16 sm:w-20 bg-neutral-900/90 border-r border-neutral-800 flex flex-col items-center justify-between py-4 shrink-0 z-20">
            {/* Top Status */}
            <div className="flex flex-col items-center space-y-1">
              <span className="text-xs font-semibold text-white font-sans">9:41</span>
              <div className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 h-1 bg-white rounded-xs" />
                <span className="w-0.5 h-1.5 bg-white rounded-xs" />
                <span className="w-0.5 h-2 bg-white rounded-xs" />
                <span className="w-0.5 h-2.5 bg-white rounded-xs" />
              </div>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">5G</span>
            </div>

            {/* Middle Quick App Icons */}
            <div className="flex flex-col items-center space-y-3">
              <button
                onClick={() => {
                  audioEngine.playHapticClick();
                  setActiveCarTab('nowPlaying');
                }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  activeCarTab === 'nowPlaying'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
                title="Downtify"
              >
                <Music2 className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom CarPlay Home Button */}
            <button
              onClick={() => {
                audioEngine.playHapticClick();
                setActiveCarTab('home');
              }}
              className="w-10 h-10 rounded-xl border-2 border-neutral-600 hover:border-white flex items-center justify-center text-white"
            >
              <div className="w-4 h-4 rounded-md border-2 border-white" />
            </button>
          </div>

          {/* Main CarPlay Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
            {/* CarPlay Navigation Bar */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-neutral-900/70 border-b border-neutral-800/80 shrink-0">
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                <button
                  onClick={() => {
                    audioEngine.playHapticClick();
                    setActiveCarTab('nowPlaying');
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeCarTab === 'nowPlaying'
                      ? 'bg-neutral-800 text-emerald-400 font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Now Playing
                </button>
                <button
                  onClick={() => {
                    audioEngine.playHapticClick();
                    setActiveCarTab('home');
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeCarTab === 'home'
                      ? 'bg-neutral-800 text-emerald-400 font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    audioEngine.playHapticClick();
                    setActiveCarTab('library');
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeCarTab === 'library'
                      ? 'bg-neutral-800 text-emerald-400 font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Library
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Downtify Server</span>
              </div>
            </div>

            {/* CarPlay Content Tabs */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
              {/* NOW PLAYING TAB (CPNowPlayingTemplate) */}
              {activeCarTab === 'nowPlaying' && currentTrack && (
                <div className="h-full flex flex-col justify-between max-w-2xl mx-auto">
                  <div className="flex items-center gap-6 my-auto">
                    {/* Large Artwork */}
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl object-cover shadow-2xl shrink-0 border border-white/10"
                    />

                    {/* Metadata & Large Scrubber */}
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                            {currentTrack.title}
                          </h2>
                          <button
                            onClick={() => {
                              audioEngine.playHapticClick();
                              onToggleLike(currentTrack.id);
                            }}
                            className="p-1 text-neutral-400 hover:text-white"
                          >
                            <Heart
                              className={`w-6 h-6 ${
                                currentTrack.isLiked ? 'text-emerald-400 fill-emerald-400' : ''
                              }`}
                            />
                          </button>
                        </div>
                        <p className="text-sm sm:text-base text-neutral-400 truncate mt-0.5 font-medium">
                          {currentTrack.artist}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">{currentTrack.album}</p>
                      </div>

                      {/* Scrubber */}
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                          <span>{formatTime(currentTime)}</span>
                          <span>-{formatTime(duration - currentTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Oversized Automotive Controls */}
                  <div className="flex items-center justify-center gap-6 sm:gap-10 pt-2 border-t border-neutral-800/60">
                    <button
                      onClick={() => {
                        audioEngine.playHapticClick();
                        if (currentTime > 15) audioEngine.seek(currentTime - 15);
                        else audioEngine.seek(0);
                      }}
                      className="p-3 text-neutral-400 hover:text-white active:scale-90 transition-transform"
                      title="15s Back"
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>

                    <button
                      onClick={() => {
                        audioEngine.playHapticClick();
                        onPrev();
                      }}
                      className="p-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white active:scale-90 transition-transform"
                    >
                      <SkipBack className="w-7 h-7 fill-white" />
                    </button>

                    <button
                      onClick={() => {
                        audioEngine.playHapticClick();
                        if (isPlaying) audioEngine.pause();
                        else audioEngine.resume();
                      }}
                      className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 fill-black" />
                      ) : (
                        <Play className="w-8 h-8 fill-black ml-1" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        audioEngine.playHapticClick();
                        onNext();
                      }}
                      className="p-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white active:scale-90 transition-transform"
                    >
                      <SkipForward className="w-7 h-7 fill-white" />
                    </button>

                    <button
                      onClick={() => {
                        audioEngine.playHapticClick();
                        audioEngine.seek(Math.min(duration, currentTime + 15));
                      }}
                      className="p-3 text-neutral-400 hover:text-white active:scale-90 transition-transform"
                      title="15s Forward"
                    >
                      <RotateCw className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {/* HOME TAB (CPListTemplate) */}
              {activeCarTab === 'home' && (
                <div className="space-y-3 max-w-xl mx-auto">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-neutral-400">
                    Quick Mixes for Driving
                  </h3>
                  <div className="space-y-2">
                    <div
                      onClick={() => {
                        audioEngine.playHapticClick();
                        if (likedTracks[0]) onPlayTrack(likedTracks[0]);
                        setActiveCarTab('nowPlaying');
                      }}
                      className="flex items-center gap-4 p-3 bg-neutral-900 hover:bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-800 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white shrink-0">
                        <Heart className="w-6 h-6 fill-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-white">Liked Songs</p>
                        <p className="text-xs text-neutral-400 font-mono">{likedTracks.length} tracks favorited</p>
                      </div>
                      <Play className="w-5 h-5 text-emerald-400 fill-emerald-400 mr-2" />
                    </div>

                    {tracks.map((trk) => (
                      <div
                        key={trk.id}
                        onClick={() => {
                          audioEngine.playHapticClick();
                          onPlayTrack(trk);
                          setActiveCarTab('nowPlaying');
                        }}
                        className="flex items-center gap-4 p-3 bg-neutral-900/70 hover:bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-800 transition-colors"
                      >
                        <img src={trk.coverUrl} alt={trk.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-white truncate">{trk.title}</p>
                          <p className="text-xs text-neutral-400 truncate">{trk.artist}</p>
                        </div>
                        <Play className="w-5 h-5 text-neutral-400 mr-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LIBRARY TAB */}
              {activeCarTab === 'library' && (
                <div className="space-y-3 max-w-xl mx-auto">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-neutral-400">
                    Offline & Playlists
                  </h3>
                  <div className="space-y-2">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => {
                          audioEngine.playHapticClick();
                          const trk = tracks.find((t) => pl.trackIds.includes(t.id));
                          if (trk) {
                            onPlayTrack(trk);
                            setActiveCarTab('nowPlaying');
                          }
                        }}
                        className="flex items-center gap-4 p-3 bg-neutral-900 hover:bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-800 transition-colors"
                      >
                        <img src={pl.coverUrl} alt={pl.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-white truncate">{pl.name}</p>
                          <p className="text-xs text-neutral-400 font-mono">{pl.trackIds.length} tracks</p>
                        </div>
                        <Play className="w-5 h-5 text-emerald-400 fill-emerald-400 mr-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
