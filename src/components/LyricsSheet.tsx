import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LyricLine } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { Mic, FileText, CheckCircle2, ArrowDownCircle, Play, Pause } from 'lucide-react';

interface LyricsSheetProps {
  lyrics: LyricLine[];
  currentTime: number;
  duration?: number;
  isPlaying?: boolean;
  trackTitle: string;
  artistName: string;
}

export const LyricsSheet: React.FC<LyricsSheetProps> = ({
  lyrics,
  currentTime,
  duration = 0,
  isPlaying = false,
  trackTitle,
  artistName,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<number | null>(null);
  const [isUserScrolledAway, setIsUserScrolledAway] = useState(false);

  // Find index of current lyric line based on playback time
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Scroll active line to the exact center of viewport
  const scrollToActiveLine = useCallback((smooth = true) => {
    if (activeIndex < 0) return;
    const container = containerRef.current;
    const lineEl = lineRefs.current[activeIndex];
    if (!container || !lineEl) return;

    const containerHeight = container.clientHeight;
    const lineOffsetTop = lineEl.offsetTop;
    const lineHeight = lineEl.clientHeight;

    // Target scroll position puts line center in container center
    const targetScrollTop = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, [activeIndex]);

  // Initial scroll on mount or when activeIndex first changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToActiveLine(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll when activeIndex changes as audio progresses
  useEffect(() => {
    if (activeIndex >= 0) {
      // If user was scrolled away, check if we should snap back on lyric line change
      if (!isUserScrollingRef.current) {
        setIsUserScrolledAway(false);
        scrollToActiveLine(true);
      }
    }
  }, [activeIndex, scrollToActiveLine]);

  // Track user manual scrolling to temporarily avoid overriding user intent
  const handleScroll = () => {
    const container = containerRef.current;
    const lineEl = lineRefs.current[activeIndex];
    if (!container || !lineEl) return;

    const containerHeight = container.clientHeight;
    const lineOffsetTop = lineEl.offsetTop;
    const lineHeight = lineEl.clientHeight;
    const expectedTop = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);

    // If user has scrolled significantly away from center position (e.g. > 120px)
    if (Math.abs(container.scrollTop - expectedTop) > 120) {
      setIsUserScrolledAway(true);
    } else {
      setIsUserScrolledAway(false);
    }

    isUserScrollingRef.current = true;
    if (userScrollTimeoutRef.current) {
      window.clearTimeout(userScrollTimeoutRef.current);
    }

    // After 3.5 seconds of user inactivity, allow auto-centering to resume
    userScrollTimeoutRef.current = window.setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 3500);
  };

  const handleLineClick = (time: number, idx: number) => {
    audioEngine.playHapticClick();
    isUserScrollingRef.current = false;
    setIsUserScrolledAway(false);
    audioEngine.seek(time);

    // Immediate centering on click
    requestAnimationFrame(() => {
      const container = containerRef.current;
      const lineEl = lineRefs.current[idx];
      if (container && lineEl) {
        const containerHeight = container.clientHeight;
        const lineOffsetTop = lineEl.offsetTop;
        const lineHeight = lineEl.clientHeight;
        const targetScrollTop = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });
      }
    });
  };

  const handleResumeAutoScroll = () => {
    audioEngine.playHapticClick();
    isUserScrollingRef.current = false;
    setIsUserScrolledAway(false);
    scrollToActiveLine(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Live Time-Synced Lyrics</h4>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 inline" /> LRCLIB Auto-Sync
              </span>
              <span>·</span>
              <span>Auto-centers on playback</span>
            </div>
          </div>
        </div>

        {/* Sync / Center Button if user scrolled away */}
        <AnimatePresence>
          {isUserScrolledAway && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              onClick={handleResumeAutoScroll}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-full shadow-lg transition-all"
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Center Active Line</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Main Lyrics Viewport with top/bottom fade gradient masks */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar space-y-6 text-left px-2"
        style={{
          // Apple Music style smooth vertical gradient fade mask
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)',
          // Large vertical padding allows first and last lines to easily align in vertical center
          paddingTop: '42vh',
          paddingBottom: '42vh',
        }}
      >
        {lyrics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
            <FileText className="w-10 h-10 mb-2 opacity-40 text-neutral-500" />
            <p className="text-sm font-medium text-neutral-300">No synced lyrics found for this track.</p>
            <p className="text-xs text-neutral-500 mt-1">Downtify queries LRCLIB for synced LRC files during download.</p>
          </div>
        ) : (
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const distance = Math.abs(idx - activeIndex);

            return (
              <motion.div
                key={idx}
                ref={(el) => {
                  lineRefs.current[idx] = el;
                }}
                onClick={() => handleLineClick(line.time, idx)}
                layout="position"
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className={`cursor-pointer transition-all duration-300 rounded-2xl p-3 select-none group relative ${
                  isActive
                    ? 'text-white text-2xl sm:text-3xl font-extrabold opacity-100 scale-[1.03] bg-white/10 shadow-lg border border-white/10'
                    : distance === 1
                    ? 'text-neutral-300 text-xl sm:text-2xl font-semibold opacity-60 hover:opacity-90'
                    : distance === 2
                    ? 'text-neutral-400 text-lg sm:text-xl font-medium opacity-40 hover:opacity-75'
                    : 'text-neutral-500 text-base sm:text-lg font-medium opacity-25 hover:opacity-60'
                }`}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className={`text-[10px] font-mono shrink-0 transition-opacity ${
                      isActive
                        ? 'text-emerald-400 font-bold opacity-100'
                        : 'text-neutral-600 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {Math.floor(line.time / 60)}:{String(Math.floor(line.time % 60)).padStart(2, '0')}
                  </span>
                  <span className="leading-snug tracking-tight">{line.text}</span>
                </div>

                {/* Subtle indicator beam on active line */}
                {isActive && (
                  <motion.div
                    layoutId="activeLyricBeam"
                    className="absolute -left-1 top-2 bottom-2 w-1 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                  />
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
