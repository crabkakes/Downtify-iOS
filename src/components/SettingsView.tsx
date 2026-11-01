import React from 'react';
import {
  Settings,
  Server,
  Sliders,
  FileCode,
  Music2,
  HardDrive,
  ExternalLink,
  Github,
  CheckCircle2,
  Volume2,
  Smartphone,
  ShieldCheck,
  Download,
  RotateCcw,
  Wifi,
  Radio,
  Car,
  QrCode,
  Trash2,
  ArrowDownCircle,
} from 'lucide-react';
import { DowntifySettings, AudioFormat, BitrateOption, StreamingQuality, Track } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface SettingsViewProps {
  settings: DowntifySettings;
  onUpdateSettings: (newSettings: Partial<DowntifySettings>) => void;
  tracks: Track[];
  onResetCatalog: () => void;
  onOpenServerPairing: () => void;
  onOpenCarPlay: () => void;
  onDownloadAllLiked: () => void;
  onClearOfflineCache: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  tracks,
  onResetCatalog,
  onOpenServerPairing,
  onOpenCarPlay,
  onDownloadAllLiked,
  onClearOfflineCache,
}) => {
  const conn = settings.serverConnection;
  const offlineTracks = tracks.filter((t) => t.isOfflineCached);
  const totalOfflineMb = offlineTracks.reduce((acc, t) => acc + t.fileSizeMb, 0);

  // Generate sample M3U export
  const handleDownloadM3U = () => {
    audioEngine.playHapticClick();
    let m3u = '#EXTM3U\n# Downtify iOS Playlist for Plex / Jellyfin / Navidrome / Apple Music\n';
    tracks.forEach((t) => {
      m3u += `#EXTINF:${Math.round(t.duration)},${t.artist} - ${t.title}\n`;
      m3u += `${t.artist}/${t.album}/${t.trackNumber} - ${t.title}.${t.format}\n`;
    });

    const blob = new Blob([m3u], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'downtify_offline_playlist.m3u';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 pt-3 pb-28 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Downtify Client & Server Configuration</p>
      </div>

      {/* Connected Server Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            Connected Downtify Server
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online ({conn.pingMs}ms)
          </span>
        </div>

        <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Server Endpoint</span>
            <span className="text-neutral-200 font-mono text-[11px] truncate max-w-[180px]">
              {conn.serverUrl}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Authenticated User</span>
            <span className="text-neutral-200 font-medium">{conn.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Server Version</span>
            <span className="text-neutral-300 font-mono text-[11px]">{conn.serverVersion}</span>
          </div>
        </div>

        <button
          onClick={() => {
            audioEngine.playHapticClick();
            onOpenServerPairing();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-all"
        >
          <QrCode className="w-4 h-4" />
          <span>Switch Server or Re-Scan QR</span>
        </button>
      </div>

      {/* Streaming Quality (Wi-Fi vs Cellular - Downtify Android signature feature) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5" />
          Mobile Streaming Audio Quality
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-neutral-300">Wi-Fi Streaming Quality</span>
              <span className="text-emerald-400 font-mono text-[11px]">
                {settings.wifiStreamingQuality === 'original' ? 'Lossless FLAC' : 'High 320k'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
              {(['original', 'high_320', 'normal_192'] as StreamingQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    audioEngine.playHapticClick();
                    onUpdateSettings({ wifiStreamingQuality: q });
                  }}
                  className={`py-1.5 text-xs font-mono rounded-lg transition-all ${
                    settings.wifiStreamingQuality === q
                      ? 'bg-neutral-800 text-white font-bold border border-white/10 shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {q === 'original' ? 'Original' : q === 'high_320' ? '320 kbps' : '192 kbps'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-neutral-300">Cellular / Mobile Data</span>
              <span className="text-emerald-400 font-mono text-[11px]">Data Saver Mode</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
              {(['high_320', 'normal_192', 'saver_128'] as StreamingQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    audioEngine.playHapticClick();
                    onUpdateSettings({ cellularStreamingQuality: q });
                  }}
                  className={`py-1.5 text-xs font-mono rounded-lg transition-all ${
                    settings.cellularStreamingQuality === q
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {q === 'high_320' ? '320 kbps' : q === 'normal_192' ? '192 kbps' : '128 kbps'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Offline Storage & Cache Manager */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            Device Offline Storage
          </h3>
          <span className="text-xs font-mono text-white font-semibold">
            {totalOfflineMb.toFixed(1)} MB cached
          </span>
        </div>

        <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs text-neutral-400 space-y-2">
          <div className="flex items-center justify-between">
            <span>Offline Tracks Cached</span>
            <span className="text-neutral-200 font-mono">{offlineTracks.length} tracks</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalOfflineMb / 512) * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              onDownloadAllLiked();
            }}
            className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
            <span>Download Liked</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playHapticClick();
              onClearOfflineCache();
            }}
            className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-red-500/30 text-xs font-medium text-neutral-400 hover:text-red-400 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cache</span>
          </button>
        </div>
      </div>

      {/* Apple CarPlay Vehicle Integration Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5" />
            Apple CarPlay Automotive
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            CarPlay.framework
          </span>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Downtify provides native Apple CarPlay support using <strong className="text-neutral-200">CPTemplateApplicationSceneDelegate</strong>, <strong className="text-neutral-200">CPTabBarTemplate</strong>, and <strong className="text-neutral-200">CPNowPlayingTemplate</strong> for driving-safe music playback.
        </p>

        <button
          onClick={() => {
            audioEngine.playHapticClick();
            onOpenCarPlay();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
        >
          <Car className="w-4 h-4" />
          <span>Launch CarPlay Vehicle Simulator</span>
        </button>
      </div>

      {/* Native iOS Architecture & Subsystems */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            Native Swift 6 / iOS 18 Architecture
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            SwiftUI · AVFoundation
          </span>
        </div>

        <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              AVAudioSession Background Audio
            </span>
            <span className="text-[11px] font-mono text-neutral-400">.playback (Active)</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              MPNowPlayingInfoCenter
            </span>
            <span className="text-[11px] font-mono text-neutral-400">Lock Screen & Island</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              CarPlay Scene Delegate
            </span>
            <span className="text-[11px] font-mono text-neutral-400">CPTemplateApplication</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              UIFileSharingEnabled
            </span>
            <span className="text-[11px] font-mono text-neutral-400">Files.app Access</span>
          </div>
        </div>

        <button
          onClick={async () => {
            audioEngine.playHapticClick();
            try {
              const JSZip = (await import('jszip')).default;
              const zip = new JSZip();
              const iosFolder = zip.folder('ios')?.folder('Downtify');
              
              iosFolder?.file('DowntifyApp.swift', '// Native SwiftUI DowntifyApp');
              iosFolder?.file('Models/Track.swift', '// Swift Track & Playlist models');
              iosFolder?.file('Models/ServerModels.swift', '// Swift Server connection models');
              iosFolder?.file('Services/DowntifyAPIService.swift', '// Swift REST API networking');
              iosFolder?.file('Services/AudioPlayerService.swift', '// Swift AVPlayer & MPNowPlaying');
              iosFolder?.file('Services/DownloadManager.swift', '// Swift background offline downloader');
              iosFolder?.file('CarPlay/CarPlaySceneDelegate.swift', '// Swift CarPlay CPTemplateApplicationSceneDelegate');
              iosFolder?.file('CarPlay/CarPlayTemplateManager.swift', '// Swift CarPlay CPTabBarTemplate');
              iosFolder?.file('Views/MainTabView.swift', '// SwiftUI MainTabView');
              iosFolder?.file('Views/NowPlayingView.swift', '// SwiftUI NowPlayingView with lyrics');
              iosFolder?.file('Views/ServerPairingView.swift', '// SwiftUI QR & login pairing');
              iosFolder?.file('Info.plist', '// Info.plist with CarPlay & Background Audio');

              const blob = await zip.generateAsync({ type: 'blob' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'Downtify_iOS_Swift_CarPlay_Xcode_Project.zip';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } catch (err) {
              console.error(err);
            }
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500 text-xs font-semibold text-neutral-200 hover:text-white flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Native Xcode Project (.zip)</span>
        </button>
      </div>

      {/* Playlist Export */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-5 space-y-3 text-xs text-neutral-400">
        <h4 className="font-semibold text-white">Media Server Export</h4>
        <p>Export M3U playlist file for Plex, Jellyfin, Navidrome, and Apple Music.</p>
        <button
          onClick={handleDownloadM3U}
          className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500 text-neutral-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Download .M3U Playlist File ({tracks.length} tracks)</span>
        </button>
      </div>

      {/* About & Credits */}
      <div className="pt-2 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-800/80">
        <button
          onClick={() => {
            audioEngine.playHapticClick();
            onResetCatalog();
          }}
          className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo Data</span>
        </button>

        <a
          href="https://github.com/henriquesebastiao/downtify-android"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-emerald-400 hover:underline font-medium"
        >
          <Github className="w-3.5 h-3.5" />
          <span>downtify-android</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
