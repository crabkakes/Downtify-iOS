import React from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { Track } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { AudioVisualizer } from './AudioVisualizer';

interface MiniPlayerBarProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onOpenFullPlayer: () => void;
  onNext: () => void;
}

export const MiniPlayerBar: React.FC<MiniPlayerBarProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  onOpenFullPlayer,
  onNext,
}) => {
  if (!track) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="px-3 pb-1 shrink-0">
      <motion.div
        layout
        onClick={() => {
          audioEngine.playHapticClick();
          onOpenFullPlayer();
        }}
        className="relative flex items-center justify-between p-2 pl-2.5 pr-3 rounded-2xl bg-neutral-900/90 backdrop-blur-xl border border-white/10 shadow-lg cursor-pointer overflow-hidden group hover:bg-neutral-900 transition-colors"
      >
        {/* Progress micro-bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-11 h-11 rounded-xl object-cover shadow shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{track.title}</p>
            <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-2">
          {/* Mini frequency bars */}
          <AudioVisualizer isPlaying={isPlaying} className="w-12 h-4 hidden sm:block" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              audioEngine.playHapticClick();
              if (isPlaying) audioEngine.pause();
              else audioEngine.resume();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-transform active:scale-90"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              audioEngine.playHapticClick();
              onNext();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-transform active:scale-90"
            aria-label="Next track"
          >
            <SkipForward className="w-5 h-5 fill-white" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
