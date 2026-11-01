import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, DownloadCloud, Volume2 } from 'lucide-react';
import { Track, DownloadJob } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface DynamicIslandProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  activeJob: DownloadJob | null;
  onOpenPlayer: () => void;
  onOpenDownloads: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  currentTrack,
  isPlaying,
  activeJob,
  onOpenPlayer,
  onOpenDownloads,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActivity = isPlaying || activeJob;

  return (
    <div className="relative z-50 flex justify-center w-full px-6 pt-3 pointer-events-auto">
      <motion.div
        layout
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        onClick={() => {
          audioEngine.playHapticClick();
          if (isExpanded) {
            setIsExpanded(false);
          } else if (hasActivity) {
            setIsExpanded(true);
          }
        }}
        className={`bg-black text-white rounded-[26px] cursor-pointer shadow-2xl transition-all border border-neutral-800/60 overflow-hidden ${
          isExpanded
            ? 'w-[92%] max-w-[370px] p-4'
            : hasActivity
            ? 'h-[36px] px-3.5 flex items-center justify-between gap-3 min-w-[210px]'
            : 'h-[32px] w-[124px] flex items-center justify-center'
        }`}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-3 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {activeJob && activeJob.status !== 'completed' ? (
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenDownloads();
                  }}
                >
                  <img
                    src={activeJob.coverUrl}
                    alt={activeJob.title}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <DownloadCloud className="w-3.5 h-3.5 animate-pulse" />
                      <span>Downtify Engine</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-400">{activeJob.progress}%</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-100 truncate">{activeJob.title}</p>
                    <p className="text-xs text-neutral-400 truncate">{activeJob.stageLabel}</p>
                  </div>
                </div>
              ) : currentTrack ? (
                <div className="flex flex-col gap-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => {
                      setIsExpanded(false);
                      onOpenPlayer();
                    }}
                  >
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-12 h-12 rounded-xl object-cover shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
                      <p className="text-xs text-neutral-400 truncate">{currentTrack.artist}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
                        <span>{currentTrack.format}</span>
                        <span>·</span>
                        <span>{currentTrack.bitrate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                    <button
                      onClick={() => {
                        audioEngine.playHapticClick();
                        if (isPlaying) {
                          audioEngine.pause();
                        } else {
                          audioEngine.resume();
                        }
                      }}
                      className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                    </button>

                    <button
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenPlayer();
                      }}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      Open Full Player →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-neutral-400">Downtify Ready</div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between w-full"
            >
              {activeJob && activeJob.status !== 'completed' ? (
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <DownloadCloud className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
                    <span className="text-xs font-medium text-neutral-200 truncate max-w-[90px]">
                      {activeJob.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span className="text-[11px] font-mono text-emerald-400 font-medium">
                      {activeJob.progress}%
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </>
              ) : currentTrack && isPlaying ? (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-5 h-5 rounded-md object-cover shrink-0"
                    />
                    <span className="text-xs font-medium text-neutral-200 truncate max-w-[100px]">
                      {currentTrack.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 pl-2 shrink-0">
                    <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                    <span className="w-0.5 h-4 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s]" />
                    <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.4s]" />
                  </div>
                </>
              ) : currentTrack ? (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-4 h-4 rounded-md object-cover shrink-0 opacity-70"
                    />
                    <span className="text-[11px] font-medium text-neutral-400 truncate max-w-[110px]">
                      {currentTrack.title}
                    </span>
                  </div>
                  <Volume2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                </>
              ) : (
                <div className="w-full flex justify-center items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-700/60" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-900/80" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
