import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Maximize2, Minimize2 } from 'lucide-react';
import { DynamicIsland } from './DynamicIsland';
import { VolumeHUD } from './VolumeHUD';
import { Track, DownloadJob } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface IPhoneShellProps {
  children: React.ReactNode;
  currentTrack: Track | null;
  isPlaying: boolean;
  activeJob: DownloadJob | null;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onOpenPlayer: () => void;
  onOpenDownloads: () => void;
  mode: 'iphone' | 'fullscreen';
  onToggleMode: () => void;
}

export const IPhoneShell: React.FC<IPhoneShellProps> = ({
  children,
  currentTrack,
  isPlaying,
  activeJob,
  volume,
  onVolumeChange,
  onOpenPlayer,
  onOpenDownloads,
  mode,
  onToggleMode,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState('9:41');
  const [showVolumeHud, setShowVolumeHud] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      // format as 9:41 style
      hours = hours % 12 || 12;
      setCurrentTimeStr(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleVolumeUp = () => {
    audioEngine.playHapticClick();
    const next = Math.min(1, volume + 0.1);
    onVolumeChange(next);
    setShowVolumeHud(true);
    setTimeout(() => setShowVolumeHud(false), 1200);
  };

  const handleVolumeDown = () => {
    audioEngine.playHapticClick();
    const next = Math.max(0, volume - 0.1);
    onVolumeChange(next);
    setShowVolumeHud(true);
    setTimeout(() => setShowVolumeHud(false), 1200);
  };

  const handleActionButton = () => {
    audioEngine.playHapticClick();
    if (isPlaying) audioEngine.pause();
    else audioEngine.resume();
  };

  if (mode === 'fullscreen') {
    return (
      <div className="relative w-full h-screen bg-neutral-950 text-white flex flex-col overflow-hidden">
        {/* Toggle Mode Button */}
        <button
          onClick={onToggleMode}
          className="fixed top-3 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-medium text-neutral-300 hover:text-white shadow-xl transition-all"
          title="Switch to iPhone Device Frame"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>iPhone Frame</span>
        </button>

        {/* Dynamic Island at Top */}
        <DynamicIsland
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          activeJob={activeJob}
          onOpenPlayer={onOpenPlayer}
          onOpenDownloads={onOpenDownloads}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center p-2 sm:p-6 lg:p-8 select-none relative overflow-x-hidden">
      {/* Top Banner with Frame Mode Switcher */}
      <div className="w-full max-w-sm sm:max-w-md flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-neutral-300">Downtify for iOS</span>
          <span className="text-[11px] text-neutral-500 font-mono">iPhone 16 Pro</span>
        </div>

        <button
          onClick={onToggleMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-sm"
        >
          <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fullscreen</span>
        </button>
      </div>

      {/* iPhone 16 Pro Physical Hardware Chassis */}
      <div className="relative group">
        {/* Side Hardware Buttons */}
        {/* Left Side: Action Button */}
        <div
          onClick={handleActionButton}
          title="Action Button (Play / Pause)"
          className="absolute -left-[14px] top-28 w-[3.5px] h-9 bg-neutral-700 rounded-l-md cursor-pointer hover:bg-emerald-400 transition-colors shadow"
        />
        {/* Left Side: Volume Up */}
        <div
          onClick={handleVolumeUp}
          title="Volume Up"
          className="absolute -left-[14px] top-42 w-[3.5px] h-14 bg-neutral-700 rounded-l-md cursor-pointer hover:bg-neutral-500 transition-colors shadow"
        />
        {/* Left Side: Volume Down */}
        <div
          onClick={handleVolumeDown}
          title="Volume Down"
          className="absolute -left-[14px] top-60 w-[3.5px] h-14 bg-neutral-700 rounded-l-md cursor-pointer hover:bg-neutral-500 transition-colors shadow"
        />

        {/* Right Side: Power / Lock Button */}
        <div
          onClick={() => {
            audioEngine.playHapticClick();
            if (isPlaying) audioEngine.pause();
          }}
          title="Power Button"
          className="absolute -right-[14px] top-40 w-[3.5px] h-20 bg-neutral-700 rounded-r-md cursor-pointer hover:bg-neutral-500 transition-colors shadow"
        />

        {/* Titanium Outer Frame */}
        <div className="relative w-[385px] sm:w-[410px] h-[830px] rounded-[55px] bg-[#1a1a1e] p-[11px] shadow-[0_0_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.12)] border border-neutral-700/60 flex flex-col overflow-hidden">
          {/* Inner Display Screen */}
          <div className="relative w-full h-full rounded-[45px] bg-neutral-950 flex flex-col overflow-hidden border border-neutral-900 shadow-inner">
            {/* iOS Status Bar */}
            <div className="relative z-40 flex items-center justify-between px-7 pt-3.5 pb-1 text-white select-none">
              <span className="text-[13px] font-semibold tracking-tight font-sans">
                {currentTimeStr}
              </span>

              <div className="flex items-center gap-2 text-neutral-200">
                {/* Cellular 5G */}
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 h-1.5 bg-neutral-300 rounded-sm" />
                  <span className="w-0.5 h-2 bg-neutral-300 rounded-sm" />
                  <span className="w-0.5 h-2.5 bg-neutral-300 rounded-sm" />
                  <span className="w-0.5 h-3 bg-neutral-300 rounded-sm" />
                </div>
                <Wifi className="w-3.5 h-3.5 text-neutral-300" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold font-mono">98%</span>
                  <div className="w-5 h-2.5 border border-neutral-400 rounded-md p-0.5 flex items-center">
                    <div className="w-3.5 h-full bg-emerald-400 rounded-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Island Component */}
            <div className="relative z-50 -mt-2">
              <DynamicIsland
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                activeJob={activeJob}
                onOpenPlayer={onOpenPlayer}
                onOpenDownloads={onOpenDownloads}
              />
            </div>

            {/* On-screen Volume HUD */}
            <VolumeHUD volume={volume} visible={showVolumeHud} />

            {/* App Screen View */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {children}
            </div>

            {/* iOS Bottom Home Indicator Bar */}
            <div className="relative z-40 w-full py-2 flex items-center justify-center bg-transparent pointer-events-auto">
              <div
                onClick={() => {
                  audioEngine.playHapticClick();
                  // Swipe up simulator
                  window.dispatchEvent(new CustomEvent('downtify:homeBarTap'));
                }}
                className="w-32 h-1 bg-white/40 hover:bg-white/70 active:bg-white rounded-full cursor-pointer transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
