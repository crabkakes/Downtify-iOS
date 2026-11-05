import React from 'react';
import {
  Server,
  Heart,
  Play,
  DownloadCloud,
  Clock,
  Sparkles,
  ArrowRight,
  Wifi,
  Radio,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { Track, Playlist, ServerConnection, DownloadJob } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface HomeViewProps {
  connection: ServerConnection;
  tracks: Track[];
  playlists: Playlist[];
  jobs: DownloadJob[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onOpenServerPairing: () => void;
  onNavigateToSearch: () => void;
  onToggleLike: (trackId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  connection,
  tracks,
  playlists,
  jobs,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenServerPairing,
  onNavigateToSearch,
  onToggleLike,
}) => {
  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const likedTracks = tracks.filter((t) => t.isLiked);
  const activeJobs = jobs.filter((j) => j.status !== 'completed' && j.status !== 'failed');

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 pt-3 pb-28 space-y-6">
      {/* Top Header & Server Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <span>
              {connection.status === 'connected' && connection.username
                ? `${greeting}, ${connection.username}`
                : 'Self-Hosted Music Companion'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            Downtify
          </h1>
        </div>

        {/* Server Connection Pill */}
        <button
          onClick={() => {
            audioEngine.playHapticClick();
            onOpenServerPairing();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all shadow-sm ${
            connection.status === 'connected' && connection.serverUrl
              ? 'bg-neutral-900 border-neutral-800 hover:border-emerald-500/50 text-neutral-300'
              : 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-400 animate-pulse'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connection.status === 'connected' && connection.serverUrl
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400'
            }`}
          />
          <span className="font-mono text-[11px] truncate max-w-[130px]">
            {connection.status === 'connected' && connection.serverUrl
              ? connection.serverUrl.replace(/^https?:\/\//, '')
              : 'Connect Server'}
          </span>
          {connection.status === 'connected' && connection.pingMs > 0 && (
            <span className="text-[10px] text-neutral-500 font-mono">
              {connection.pingMs}ms
            </span>
          )}
        </button>
      </div>

      {/* Disconnected / Initial Pairing Prompt Card */}
      {(!connection.serverUrl || connection.status !== 'connected') && (
        <div
          onClick={() => {
            audioEngine.playHapticClick();
            onOpenServerPairing();
          }}
          className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/30 flex items-center justify-between cursor-pointer hover:border-emerald-500/60 transition-all shadow-lg shadow-emerald-950/20"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Connect Downtify Server</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pair your self-hosted instance to load your actual music library
              </p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs shadow-md shrink-0 transition-colors">
            Pair Now
          </button>
        </div>
      )}

      {/* Quick Access Grid (Spotify / Downtify-Android signature) */}
      <div className={`grid ${playlists.length > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
        {/* Liked Songs Special Card */}
        <div
          onClick={() => {
            audioEngine.playHapticClick();
            if (likedTracks[0]) onPlayTrack(likedTracks[0]);
          }}
          className="flex items-center gap-3 p-2 bg-neutral-900/80 hover:bg-neutral-800 rounded-2xl border border-neutral-800/80 cursor-pointer transition-all active:scale-[0.98] group overflow-hidden"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center shrink-0 shadow">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">Liked Songs</p>
            <p className="text-[10px] text-neutral-400 font-mono">{likedTracks.length} tracks</p>
          </div>
        </div>

        {/* Top Playlists */}
        {playlists.slice(0, 3).map((pl) => (
          <div
            key={pl.id}
            onClick={() => {
              audioEngine.playHapticClick();
              const trk = tracks.find((t) => pl.trackIds.includes(t.id));
              if (trk) onPlayTrack(trk);
            }}
            className="flex items-center gap-3 p-2 bg-neutral-900/80 hover:bg-neutral-800 rounded-2xl border border-neutral-800/80 cursor-pointer transition-all active:scale-[0.98] group overflow-hidden"
          >
            <img
              src={pl.coverUrl}
              alt={pl.name}
              className="w-12 h-12 rounded-xl object-cover shrink-0 shadow"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{pl.name}</p>
              <p className="text-[10px] text-neutral-400 font-mono">{pl.trackIds.length} tracks</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Server Downloads Card (if any downloading or quick link trigger) */}
      <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-3xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Server Conversion Engine
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {activeJobs.length > 0 ? `${activeJobs.length} active tasks` : 'Idle'}
          </span>
        </div>

        {activeJobs.length > 0 ? (
          <div className="space-y-2">
            {activeJobs.slice(0, 2).map((j) => (
              <div key={j.id} className="p-2.5 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs">
                <div className="flex items-center justify-between text-neutral-200">
                  <span className="font-medium truncate max-w-[200px]">{j.title}</span>
                  <span className="font-mono text-emerald-400 text-[11px]">{j.progress}%</span>
                </div>
                <div className="w-full h-1 bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${j.progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-neutral-400">
                  <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                  <span>{j.stageLabel}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <p className="text-[11px] text-neutral-400">
              Paste Spotify or YouTube Music links in Search to download directly to your server.
            </p>
            <button
              onClick={() => {
                audioEngine.playHapticClick();
                onNavigateToSearch();
              }}
              className="text-xs font-semibold text-emerald-400 hover:underline shrink-0 ml-2"
            >
              Add Music →
            </button>
          </div>
        )}
      </div>

      {/* Recently Played on Server or Ready State */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            {tracks.length > 0 ? 'Recently Played on Server' : 'Your Music Library'}
          </h2>
          {tracks.length > 0 && <span className="text-xs text-neutral-500 font-mono">Synced</span>}
        </div>

        {tracks.length === 0 ? (
          <div className="p-6 bg-neutral-900/40 border border-neutral-800/80 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">No Tracks in Library Yet</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                Connect your Downtify instance or paste a music link to queue and stream your first song.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => {
                  audioEngine.playHapticClick();
                  onOpenServerPairing();
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs shadow-md transition-colors"
              >
                Pair Server
              </button>
              <button
                onClick={() => {
                  audioEngine.playHapticClick();
                  onNavigateToSearch();
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
              >
                Search & Download
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tracks.slice(0, 4).map((trk) => {
              const isCurr = currentTrack?.id === trk.id;
              return (
                <div
                  key={trk.id}
                  onClick={() => {
                    audioEngine.playHapticClick();
                    onPlayTrack(trk);
                  }}
                  className="p-3 bg-neutral-900/60 hover:bg-neutral-900 rounded-2xl border border-neutral-800/80 cursor-pointer transition-all active:scale-[0.98] group"
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 shadow">
                    <img src={trk.coverUrl} alt={trk.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-7 h-7 text-white fill-white" />
                    </div>
                    {isCurr && isPlaying && (
                      <div className="absolute bottom-2 right-2 p-1.5 bg-emerald-500 rounded-full text-black">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white truncate">{trk.title}</p>
                  <p className="text-xs text-neutral-400 truncate">{trk.artist}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-neutral-500 font-mono">
                    <span className="uppercase text-emerald-400">{trk.format}</span>
                    <span>{trk.fileSizeMb} MB</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
