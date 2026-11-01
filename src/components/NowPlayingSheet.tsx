import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Mic,
  ListMusic,
  Airplay,
  Info,
  Check,
  Share2,
  Heart,
  ArrowDownCircle,
  Car,
} from 'lucide-react';
import { Track } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { AudioVisualizer } from './AudioVisualizer';
import { LyricsSheet } from './LyricsSheet';

interface NowPlayingSheetProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onNext: () => void;
  onPrev: () => void;
  queue: Track[];
  onOpenTagEditor: (track: Track) => void;
  onToggleLike?: (trackId: string) => void;
  onToggleCacheOffline?: (trackId: string) => void;
  onOpenCarPlay?: () => void;
}

export const NowPlayingSheet: React.FC<NowPlayingSheetProps> = ({
  track,
  isOpen,
  onClose,
  isPlaying,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  onNext,
  onPrev,
  queue,
  onOpenTagEditor,
  onToggleLike,
  onToggleCacheOffline,
  onOpenCarPlay,
}) => {
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'queue'>('player');
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [showAirPlay, setShowAirPlay] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !track) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const remainingTime = duration - currentTime;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audioEngine.seek((val / 100) * duration);
  };

  const handleRepeatToggle = () => {
    audioEngine.playHapticClick();
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const handleShare = () => {
    audioEngine.playHapticClick();
    if (track.sourceUrl) {
      navigator.clipboard?.writeText(track.sourceUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 350 }}
        className="fixed inset-0 z-50 flex flex-col bg-neutral-950/95 backdrop-blur-3xl text-white overflow-hidden"
      >
        {/* Dynamic ambient color glow from album cover */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full blur-[130px] opacity-25 pointer-events-none transition-colors duration-700 bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600"
        />

        {/* Top iOS Header */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-12 pb-3 shrink-0">
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              onClose();
            }}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-neutral-300 transition-colors"
            aria-label="Dismiss player"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              PLAYING FROM {track.album ? 'ALBUM' : 'LIBRARY'}
            </span>
            <span className="text-xs font-semibold text-neutral-200 truncate max-w-[200px]">
              {track.album || 'Downtify Local'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenTagEditor(track)}
              title="Inspect ID3 Tags"
              className="p-2 rounded-full hover:bg-white/10 text-neutral-300 transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              title="Copy track link"
              className="p-2 -mr-2 rounded-full hover:bg-white/10 text-neutral-300 transition-colors"
            >
              {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="relative z-10 flex-1 flex flex-col px-7 pb-8 overflow-y-auto no-scrollbar">
          {activeTab === 'player' && (
            <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-2">
              {/* Artwork */}
              <div className="relative w-full aspect-square max-w-[320px] mx-auto my-auto flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: isPlaying ? 1 : 0.94,
                    boxShadow: isPlaying
                      ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(16, 185, 129, 0.25)'
                      : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className="w-full h-full rounded-3xl overflow-hidden border border-white/10 relative"
                >
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover select-none"
                  />
                  {/* Subtle vinyl groove reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
                </motion.div>
              </div>

              {/* Title & Metadata */}
              <div className="mt-6 mb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                      {track.title}
                    </h2>
                    <p className="text-base text-neutral-400 font-medium truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        audioEngine.playHapticClick();
                        if (onToggleLike) onToggleLike(track.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                      title={track.isLiked ? 'Unlike track' : 'Like track on server'}
                    >
                      <Heart className={`w-5 h-5 ${track.isLiked ? 'text-emerald-400 fill-emerald-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        audioEngine.playHapticClick();
                        if (onToggleCacheOffline) onToggleCacheOffline(track.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                      title={track.isOfflineCached ? 'Cached offline on iPhone' : 'Download for offline'}
                    >
                      <ArrowDownCircle className={`w-5 h-5 ${track.isOfflineCached ? 'text-emerald-400 fill-emerald-500/20' : ''}`} />
                    </button>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-emerald-400">
                      <span className="uppercase">{track.format}</span>
                      <span>·</span>
                      <span>{track.bitrate}</span>
                    </div>
                  </div>
                </div>

                {/* Real-time spectrum mini-visualizer */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                    <span>{track.genre || 'Audio'}</span>
                    <span>·</span>
                    <span>{track.releaseYear || '2024'}</span>
                    <span>·</span>
                    <span>{track.fileSizeMb} MB</span>
                  </div>
                  <AudioVisualizer isPlaying={isPlaying} className="w-24 h-5" />
                </div>
              </div>

              {/* Scrubber slider */}
              <div className="space-y-1.5 my-2">
                <div className="relative group flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progressPercent}
                    onChange={handleSliderSeek}
                    className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-white hover:accent-emerald-400 transition-all"
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-neutral-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>-{formatTime(remainingTime)}</span>
                </div>
              </div>

              {/* Transport Controls */}
              <div className="flex items-center justify-between py-2">
                <button
                  onClick={() => {
                    audioEngine.playHapticClick();
                    setIsShuffle(!isShuffle);
                  }}
                  className={`p-2.5 rounded-full transition-colors ${
                    isShuffle ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-400 hover:text-white'
                  }`}
                  aria-label="Shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 sm:gap-6">
                  <button
                    onClick={() => {
                      audioEngine.playHapticClick();
                      onPrev();
                    }}
                    className="p-3 rounded-full hover:bg-white/10 text-white transition-transform active:scale-90"
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-7 h-7 fill-white" />
                  </button>

                  <button
                    onClick={() => {
                      audioEngine.playHapticClick();
                      if (currentTime > 15) audioEngine.seek(currentTime - 15);
                      else audioEngine.seek(0);
                    }}
                    className="p-2 text-neutral-400 hover:text-white transition-transform active:scale-90"
                    title="Rewind 15s"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      audioEngine.playHapticClick();
                      if (isPlaying) audioEngine.pause();
                      else audioEngine.resume();
                    }}
                    className="w-16 h-16 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 flex items-center justify-center shadow-xl shadow-white/10 transition-transform active:scale-90"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 fill-neutral-950" />
                    ) : (
                      <Play className="w-7 h-7 fill-neutral-950 ml-1" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      audioEngine.playHapticClick();
                      audioEngine.seek(Math.min(duration, currentTime + 15));
                    }}
                    className="p-2 text-neutral-400 hover:text-white transition-transform active:scale-90"
                    title="Forward 15s"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      audioEngine.playHapticClick();
                      onNext();
                    }}
                    className="p-3 rounded-full hover:bg-white/10 text-white transition-transform active:scale-90"
                    aria-label="Next track"
                  >
                    <SkipForward className="w-7 h-7 fill-white" />
                  </button>
                </div>

                <button
                  onClick={handleRepeatToggle}
                  className={`p-2.5 rounded-full transition-colors ${
                    repeatMode !== 'off' ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-400 hover:text-white'
                  }`}
                  aria-label="Repeat mode"
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3 px-2 pt-2">
                <button
                  onClick={() => {
                    audioEngine.playHapticClick();
                    onVolumeChange(volume === 0 ? 0.8 : 0);
                  }}
                  className="text-neutral-400 hover:text-white"
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-white hover:accent-emerald-400"
                />
                <Volume2 className="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div className="flex-1 flex flex-col max-w-md mx-auto w-full py-2">
              <LyricsSheet
                lyrics={track.lyrics}
                currentTime={currentTime}
                trackTitle={track.title}
                artistName={track.artist}
              />
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="flex-1 flex flex-col max-w-md mx-auto w-full py-2">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-sm font-semibold text-white">Playing Next</h4>
                <span className="text-xs text-neutral-400 font-mono">{queue.length} tracks</span>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 py-3">
                {queue.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      audioEngine.playHapticClick();
                      audioEngine.playTrack(item);
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
                      item.id === track.id
                        ? 'bg-emerald-500/15 border border-emerald-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-5 text-center text-xs font-mono text-neutral-400">
                      {idx + 1}
                    </span>
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${item.id === track.id ? 'text-emerald-400' : 'text-white'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">{item.artist}</p>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">
                      {formatTime(item.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Tab Bar for Player */}
        <div className="relative z-10 flex items-center justify-around py-3 px-6 border-t border-white/10 bg-neutral-900/60 backdrop-blur-2xl shrink-0 safe-bottom">
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('lyrics');
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              activeTab === 'lyrics' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-[10px] font-medium">Lyrics</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setShowAirPlay(true);
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-400 hover:text-white transition-colors"
          >
            <Airplay className="w-5 h-5" />
            <span className="text-[10px] font-medium">AirPlay</span>
          </button>

          {onOpenCarPlay && (
            <button
              onClick={() => {
                audioEngine.playHapticClick();
                onOpenCarPlay();
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-400 hover:text-white transition-colors"
              title="Launch Apple CarPlay Simulator"
            >
              <Car className="w-5 h-5" />
              <span className="text-[10px] font-medium">CarPlay</span>
            </button>
          )}

          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab(activeTab === 'player' ? 'queue' : 'player');
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              activeTab === 'queue' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-5 h-5" />
            <span className="text-[10px] font-medium">Queue</span>
          </button>
        </div>

        {/* Simulated iOS AirPlay Modal */}
        <AnimatePresence>
          {showAirPlay && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="w-full max-w-sm bg-neutral-900/95 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Airplay className="w-5 h-5 text-white" />
                    <h3 className="text-base font-semibold text-white">AirPlay & Bluetooth</h3>
                  </div>
                  <button
                    onClick={() => setShowAirPlay(false)}
                    className="text-xs text-emerald-400 font-semibold"
                  >
                    Done
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 border border-white/15">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
                        iOS
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">iPhone Speaker (Internal)</p>
                        <p className="text-xs text-emerald-400">Active Output · 48 kHz 24-bit</p>
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center font-bold text-xs">
                        AP
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-300">AirPods Pro (2nd Gen)</p>
                        <p className="text-xs text-neutral-500">Nearby · Spatial Audio Supported</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center font-bold text-xs">
                        TV
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-300">Living Room Apple TV 4K</p>
                        <p className="text-xs text-neutral-500">Wi-Fi Connected</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
