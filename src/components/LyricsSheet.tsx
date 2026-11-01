import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { LyricLine } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { Mic, FileText, CheckCircle2 } from 'lucide-react';

interface LyricsSheetProps {
  lyrics: LyricLine[];
  currentTime: number;
  trackTitle: string;
  artistName: string;
}

export const LyricsSheet: React.FC<LyricsSheetProps> = ({
  lyrics,
  currentTime,
  trackTitle,
  artistName,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Find index of current lyric line
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  const handleLineClick = (time: number) => {
    audioEngine.playHapticClick();
    audioEngine.seek(time);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Live Time-Synced Lyrics</h4>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 inline" /> LRCLIB Synced
              </span>
              <span>·</span>
              <span>Tap any line to scrub</span>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto no-scrollbar py-8 space-y-6 text-left px-1"
      >
        {lyrics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
            <FileText className="w-10 h-10 mb-2 opacity-40 text-neutral-500" />
            <p className="text-sm font-medium text-neutral-300">No synced lyrics available for this track.</p>
            <p className="text-xs text-neutral-500 mt-1">Downtify queries LRCLIB for synced LRC files during download.</p>
          </div>
        ) : (
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPassed = idx < activeIndex;

            return (
              <motion.div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => handleLineClick(line.time)}
                layout
                className={`cursor-pointer transition-all duration-300 rounded-xl p-2 select-none group ${
                  isActive
                    ? 'text-white text-xl md:text-2xl font-bold opacity-100 scale-[1.02] bg-white/5'
                    : isPassed
                    ? 'text-neutral-400 text-lg md:text-xl font-medium opacity-50 hover:opacity-80'
                    : 'text-neutral-500 text-lg md:text-xl font-medium opacity-40 hover:opacity-75'
                }`}
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] font-mono text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {Math.floor(line.time / 60)}:{String(Math.floor(line.time % 60)).padStart(2, '0')}
                  </span>
                  <span className="leading-snug">{line.text}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
