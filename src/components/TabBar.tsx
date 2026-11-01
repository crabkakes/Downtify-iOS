import React from 'react';
import { DownloadCloud, Library, Settings, Disc3 } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export type TabType = 'downloader' | 'library' | 'settings';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeDownloadsCount: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  activeDownloadsCount,
}) => {
  return (
    <div className="relative z-30 px-6 py-2 bg-neutral-900/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around shrink-0 select-none">
      <button
        onClick={() => {
          audioEngine.playHapticClick();
          onTabChange('downloader');
        }}
        className={`relative flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all ${
          activeTab === 'downloader' ? 'text-emerald-400 font-semibold' : 'text-neutral-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <DownloadCloud className="w-5 h-5" />
          {activeDownloadsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
              {activeDownloadsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight">Downloader</span>
      </button>

      <button
        onClick={() => {
          audioEngine.playHapticClick();
          onTabChange('library');
        }}
        className={`relative flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all ${
          activeTab === 'library' ? 'text-emerald-400 font-semibold' : 'text-neutral-400 hover:text-white'
        }`}
      >
        <Library className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Library</span>
      </button>

      <button
        onClick={() => {
          audioEngine.playHapticClick();
          onTabChange('settings');
        }}
        className={`relative flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all ${
          activeTab === 'settings' ? 'text-emerald-400 font-semibold' : 'text-neutral-400 hover:text-white'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Settings</span>
      </button>
    </div>
  );
};
