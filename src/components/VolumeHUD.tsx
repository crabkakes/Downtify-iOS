import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeHUDProps {
  volume: number; // 0 to 1
  visible: boolean;
}

export const VolumeHUD: React.FC<VolumeHUDProps> = ({ volume, visible }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1400);
      return () => clearTimeout(timer);
    }
  }, [visible, volume]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -15, scale: 0.92 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="absolute left-3 top-28 z-50 flex items-center gap-2 p-2 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-none"
        >
          {volume === 0 ? (
            <VolumeX className="w-4 h-4 text-neutral-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
          <div className="w-20 h-2 bg-neutral-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-white rounded-full transition-all duration-75"
              style={{ width: `${Math.round(volume * 100)}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
