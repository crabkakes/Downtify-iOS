import React from 'react';
import {
  Settings,
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
} from 'lucide-react';
import { DowntifySettings, AudioFormat, BitrateOption, Track } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface SettingsViewProps {
  settings: DowntifySettings;
  onUpdateSettings: (newSettings: Partial<DowntifySettings>) => void;
  tracks: Track[];
  onResetCatalog: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  tracks,
  onResetCatalog,
}) => {
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
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 pt-4 pb-28 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Downtify Pipeline & Output Preferences</p>
        </div>
      </div>

      {/* Codec & Quality Defaults */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          Default Encoding Settings
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Default Audio Codec</label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
              {(['flac', 'mp3', 'm4a', 'opus'] as AudioFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    audioEngine.playHapticClick();
                    onUpdateSettings({ defaultFormat: fmt });
                  }}
                  className={`py-1.5 text-xs font-mono uppercase rounded-lg font-medium transition-all ${
                    settings.defaultFormat === fmt
                      ? 'bg-neutral-800 text-white font-bold border border-white/10 shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Default Bitrate</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
              {(['192k', '256k', '320k'] as BitrateOption[]).map((br) => (
                <button
                  key={br}
                  onClick={() => {
                    audioEngine.playHapticClick();
                    onUpdateSettings({ defaultBitrate: br });
                  }}
                  className={`py-1.5 text-xs font-mono rounded-lg font-medium transition-all ${
                    settings.defaultBitrate === br
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {br}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">File Naming Scheme</label>
            <select
              value={settings.namingPattern}
              onChange={(e) => {
                audioEngine.playHapticClick();
                onUpdateSettings({ namingPattern: e.target.value });
              }}
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="{artist}/{album}/{track_number} - {title}">
                {'{artist}/{album}/{track_number} - {title}'} (Default)
              </option>
              <option value="{artist} - {title}">
                {'{artist} - {title}'}
              </option>
              <option value="{album}/{track_number} - {title}">
                {'{album}/{track_number} - {title}'}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Metadata & Tagging */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
          <FileCode className="w-3.5 h-3.5" />
          Tags & Lyrics (LRCLIB & mutagen)
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">Fetch Synced Lyrics (LRCLIB)</p>
              <p className="text-[11px] text-neutral-400">Time-synced .lrc lyrics for karaoke playback</p>
            </div>
            <button
              onClick={() => {
                audioEngine.playHapticClick();
                onUpdateSettings({ fetchLyrics: !settings.fetchLyrics });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.fetchLyrics ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.fetchLyrics ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <div>
              <p className="text-xs font-medium text-white">Embed Full-Res Artwork</p>
              <p className="text-[11px] text-neutral-400">Embed 1200x1200px cover art inside audio file</p>
            </div>
            <button
              onClick={() => {
                audioEngine.playHapticClick();
                onUpdateSettings({ embedCoverArt: !settings.embedCoverArt });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.embedCoverArt ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.embedCoverArt ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <div>
              <p className="text-xs font-medium text-white">Simulated iOS Haptics</p>
              <p className="text-[11px] text-neutral-400">Audio feedback click on buttons and scrubbers</p>
            </div>
            <button
              onClick={() => {
                audioEngine.playHapticClick();
                onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.hapticsEnabled ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.hapticsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Media Server Exports */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          Media Server & App Integrations
        </h3>
        <p className="text-xs text-neutral-400">
          Export M3U playlist file formatted for Plex, Jellyfin, Navidrome, and Apple Music.
        </p>

        <button
          onClick={handleDownloadM3U}
          className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500 text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download .M3U Playlist File ({tracks.length} tracks)</span>
        </button>
      </div>

      {/* About Downtify */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-5 space-y-3 text-xs text-neutral-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="font-semibold text-white">About Downtify</h4>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">henriquesebastiao/downtify</span>
        </div>
        <p className="leading-relaxed">
          Inspired by Henrique Sebastião’s open-source Downtify. It turns Spotify, YouTube Music, and SoundCloud links into a fully tagged local audio library without requiring Spotify developer accounts or API keys.
        </p>
        <div className="p-3 bg-neutral-950 rounded-xl font-mono text-[11px] text-neutral-300 space-y-1">
          <p>• Public Spotify Embed Scraping (No API key needed)</p>
          <p>• ytmusicapi exact duration match</p>
          <p>• yt-dlp stream extraction & ffmpeg conversion</p>
          <p>• mutagen ID3v2 & cover embedding</p>
          <p>• LRCLIB synchronized lyrics</p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              onResetCatalog();
            }}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Library & Samples</span>
          </button>

          <a
            href="https://github.com/henriquesebastiao/downtify"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:underline font-medium"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
