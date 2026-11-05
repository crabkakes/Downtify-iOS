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
  Image as ImageIcon,
  Globe,
  LogOut,
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
  onOpenScreenshots: () => void;
  onDownloadAllLiked: () => void;
  onClearOfflineCache: () => void;
  onDisconnectServer: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  tracks,
  onResetCatalog,
  onOpenServerPairing,
  onOpenCarPlay,
  onOpenScreenshots,
  onDownloadAllLiked,
  onClearOfflineCache,
  onDisconnectServer,
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

      {/* Downtify Server Connection Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            Downtify Server Instance
          </h3>
          {conn.status === 'connected' && conn.serverUrl ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected ({conn.pingMs}ms)
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Not Connected
            </span>
          )}
        </div>

        {conn.status === 'connected' && conn.serverUrl ? (
          <>
            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Server Endpoint</span>
                <span className="text-neutral-200 font-mono text-[11px] truncate max-w-[180px]">
                  {conn.serverUrl}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Authenticated User</span>
                <span className="text-neutral-200 font-medium">{conn.username || 'Admin'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Server Version</span>
                <span className="text-neutral-300 font-mono text-[11px]">{conn.serverVersion || 'v2.8.4'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  audioEngine.playHapticClick();
                  onOpenServerPairing();
                }}
                className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Re-pair Server</span>
              </button>

              <button
                onClick={() => {
                  audioEngine.playHapticClick();
                  onDisconnectServer();
                }}
                className="py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-xs font-semibold text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-400 leading-relaxed">
              No server is currently paired. Connect to your self-hosted Downtify instance using your server IP or QR code from <strong className="text-white">Settings → Apps</strong>.
            </p>
            <button
              onClick={() => {
                audioEngine.playHapticClick();
                onOpenServerPairing();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Server className="w-4 h-4" />
              <span>Connect Downtify Server</span>
            </button>
          </div>
        )}
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

      {/* App Screenshots Showcase Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            App Screenshots Showcase
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            3 High-Res Previews
          </span>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          View full-fidelity screenshots of the <strong className="text-neutral-200">iOS 18 Now Playing Player</strong>, the <strong className="text-neutral-200">Server Companion Home</strong>, and the <strong className="text-neutral-200">Apple CarPlay Dashboard</strong>.
        </p>

        <div className="grid grid-cols-3 gap-2">
          <div
            onClick={() => {
              audioEngine.playHapticClick();
              onOpenScreenshots();
            }}
            className="aspect-[9/16] rounded-xl overflow-hidden border border-neutral-800 cursor-pointer hover:border-emerald-500 transition-all group"
          >
            <img src="/screenshots/player.jpg" alt="Player Screenshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
          <div
            onClick={() => {
              audioEngine.playHapticClick();
              onOpenScreenshots();
            }}
            className="aspect-[9/16] rounded-xl overflow-hidden border border-neutral-800 cursor-pointer hover:border-emerald-500 transition-all group"
          >
            <img src="/screenshots/home.jpg" alt="Home Screenshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
          <div
            onClick={() => {
              audioEngine.playHapticClick();
              onOpenScreenshots();
            }}
            className="aspect-[9/16] rounded-xl overflow-hidden border border-neutral-800 cursor-pointer hover:border-emerald-500 transition-all group"
          >
            <img src="/screenshots/carplay.jpg" alt="CarPlay Screenshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        </div>

        <button
          onClick={() => {
            audioEngine.playHapticClick();
            onOpenScreenshots();
          }}
          className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition-all"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Open Fullscreen Screenshot Gallery</span>
        </button>
      </div>

      {/* Native iOS Architecture & Subsystems */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            iOS 18+ & Swift 6 Compatibility Matrix
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            iOS 18.0+ Ready
          </span>
        </div>

        <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              AVAudioSession Background Audio
            </span>
            <span className="text-[11px] font-mono text-neutral-400">.playback (AirPods Pause)</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              iOS 18 Control Center Widgets
            </span>
            <span className="text-[11px] font-mono text-emerald-400">AppIntents · ControlWidget</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Apple Privacy Manifest
            </span>
            <span className="text-[11px] font-mono text-neutral-400">PrivacyInfo.xcprivacy</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Dynamic Island & Live Activities
            </span>
            <span className="text-[11px] font-mono text-neutral-400">ActivityKit · Lock Screen</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Apple CarPlay Automotive Scene
            </span>
            <span className="text-[11px] font-mono text-neutral-400">CPTemplateApplication</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Local LAN Server Discovery
            </span>
            <span className="text-[11px] font-mono text-neutral-400">NSLocalNetworkUsage</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              UIFileSharing & Sandbox Storage
            </span>
            <span className="text-[11px] font-mono text-neutral-400">/Documents/Music</span>
          </div>
        </div>

        <button
          onClick={async () => {
            audioEngine.playHapticClick();
            try {
              const JSZip = (await import('jszip')).default;
              const zip = new JSZip();
              const iosFolder = zip.folder('ios')?.folder('Downtify');
              
              iosFolder?.file('DowntifyApp.swift', '// Native SwiftUI DowntifyApp (iOS 18)');
              iosFolder?.file('PrivacyInfo.xcprivacy', '// Apple Privacy Manifest (Mandatory for iOS 17.4+ and iOS 18)');
              iosFolder?.file('Intents/DowntifyAppIntents.swift', '// iOS 18 ControlWidget & AppIntents');
              iosFolder?.file('LiveActivity/NowPlayingActivityAttributes.swift', '// iOS 18 ActivityKit Live Activities');
              iosFolder?.file('Models/Track.swift', '// Swift Track & Playlist models');
              iosFolder?.file('Models/ServerModels.swift', '// Swift Server connection models');
              iosFolder?.file('Services/KeychainHelper.swift', '// iOS Keychain secure token storage');
              iosFolder?.file('Services/DowntifyAPIService.swift', '// Swift REST API networking');
              iosFolder?.file('Services/AudioPlayerService.swift', '// Swift AVPlayer, MPNowPlaying & Route Changes');
              iosFolder?.file('Services/DownloadManager.swift', '// Swift background offline downloader');
              iosFolder?.file('CarPlay/CarPlaySceneDelegate.swift', '// Swift CarPlay CPTemplateApplicationSceneDelegate');
              iosFolder?.file('CarPlay/CarPlayTemplateManager.swift', '// Swift CarPlay CPTabBarTemplate');
              iosFolder?.file('Views/MainTabView.swift', '// SwiftUI MainTabView');
              iosFolder?.file('Views/HomeView.swift', '// SwiftUI Home dashboard');
              iosFolder?.file('Views/SearchView.swift', '// SwiftUI Live library search');
              iosFolder?.file('Views/LibraryView.swift', '// SwiftUI Offline & playlists library');
              iosFolder?.file('Views/SettingsView.swift', '// SwiftUI Audio quality & server settings');
              iosFolder?.file('Views/NowPlayingView.swift', '// SwiftUI NowPlayingView with lyrics');
              iosFolder?.file('Views/ServerPairingView.swift', '// SwiftUI QR & login pairing');
              iosFolder?.file('Info.plist', '// Info.plist with iOS 18 permissions & CarPlay');

              const blob = await zip.generateAsync({ type: 'blob' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'Downtify_iOS18_Swift6_CarPlay_Xcode_Project.zip';
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
          <span>Export Native iOS 18 Xcode Project (.zip)</span>
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
          <span>Clear Local Library</span>
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
