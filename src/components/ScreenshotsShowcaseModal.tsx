import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Smartphone, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface ScreenshotsShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScreenshotsShowcaseModal: React.FC<ScreenshotsShowcaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!isOpen) return null;

  const screenshots = [
    {
      title: 'Now Playing & Synced Lyrics',
      subtitle: 'Apple Music-grade player with auto-centering LRCLIB lyrics',
      type: 'mobile',
      image: '/screenshots/player.jpg',
      tag: 'iOS 18 Now Playing',
    },
    {
      title: 'Home Feed & Server Status',
      subtitle: 'Downtify server companion with quick mixes & recently played',
      type: 'mobile',
      image: '/screenshots/home.jpg',
      tag: 'Server Companion Home',
    },
  ];

  const current = screenshots[activeIdx];

  const handleNext = () => {
    audioEngine.playHapticClick();
    setActiveIdx((prev) => (prev + 1) % screenshots.length);
  };

  const handlePrev = () => {
    audioEngine.playHapticClick();
    setActiveIdx((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">App Screenshots Showcase</h3>
              <p className="text-[11px] text-neutral-400">Native iOS 18 Interface & Subsystems</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              onClose();
            }}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {screenshots.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                audioEngine.playHapticClick();
                setActiveIdx(idx);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                activeIdx === idx
                  ? 'bg-emerald-500 text-neutral-950 font-semibold shadow'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{s.tag}</span>
            </button>
          ))}
        </div>

        {/* Screenshot Image Container */}
        <div className="relative flex-1 flex flex-col items-center justify-center bg-black/60 rounded-2xl border border-neutral-800 p-2 overflow-hidden min-h-[380px] max-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <img
                src={current.image}
                alt={current.title}
                className="max-h-[440px] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md shadow"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md shadow"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Caption */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div>
            <h4 className="font-semibold text-white">{current.title}</h4>
            <p className="text-[11px] text-neutral-400">{current.subtitle}</p>
          </div>
          <span className="font-mono text-neutral-500 text-[11px]">
            {activeIdx + 1} of {screenshots.length}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
