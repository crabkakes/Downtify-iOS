import React, { useState } from 'react';
import {
  Search,
  DownloadCloud,
  Link as LinkIcon,
  Play,
  Heart,
  Disc,
  Check,
} from 'lucide-react';
import { Track, AudioFormat, BitrateOption } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface SearchViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onRequestDownload: (url: string, format: AudioFormat, bitrate: BitrateOption) => void;
  onToggleLike: (trackId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onRequestDownload,
  onToggleLike,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [format, setFormat] = useState<AudioFormat>('flac');
  const [bitrate, setBitrate] = useState<BitrateOption>('lossless');
  const [isSent, setIsSent] = useState(false);

  // Filtered tracks
  const filtered = tracks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    );
  });

  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    audioEngine.playHapticClick();
    onRequestDownload(urlInput.trim(), format, bitrate);
    setUrlInput('');
    setIsSent(true);
    setTimeout(() => setIsSent(false), 2200);
  };

  const handlePaste = async () => {
    try {
      audioEngine.playHapticClick();
      const txt = await navigator.clipboard.readText();
      if (txt) setUrlInput(txt.trim());
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 pt-3 pb-28 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Search & Download</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Browse server catalog or add new music</p>
      </div>

      {/* Server Library Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tracks, artists, or albums..."
          className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3.5 text-xs text-neutral-500 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Add New Music via Downtify Server */}
      <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-3xl space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Download to Server
            </h3>
          </div>
          <button
            type="button"
            onClick={handlePaste}
            className="text-xs text-emerald-400 hover:underline font-medium"
          >
            Paste Link
          </button>
        </div>

        <form onSubmit={handleDownloadSubmit} className="space-y-3">
          <div className="relative">
            <LinkIcon className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste Spotify or YouTube Music link..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {(['flac', 'mp3', 'm4a', 'opus'] as AudioFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    audioEngine.playHapticClick();
                    setFormat(fmt);
                    if (fmt === 'flac') setBitrate('lossless');
                    else if (bitrate === 'lossless') setBitrate('320k');
                  }}
                  className={`px-2 py-1 text-[11px] font-mono uppercase rounded-lg ${
                    format === fmt
                      ? 'bg-neutral-800 text-white font-bold border border-white/10'
                      : 'text-neutral-400'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!urlInput.trim()}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                urlInput.trim()
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isSent ? <Check className="w-4 h-4" /> : <DownloadCloud className="w-4 h-4" />}
              <span>{isSent ? 'Sent to Server!' : 'Download'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">
          {searchQuery ? `Results for "${searchQuery}"` : 'All Tracks on Server'}
        </h2>

        <div className="space-y-1">
          {filtered.map((trk) => {
            const isCurr = currentTrack?.id === trk.id;
            return (
              <div
                key={trk.id}
                onClick={() => {
                  audioEngine.playHapticClick();
                  onPlayTrack(trk);
                }}
                className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                  isCurr ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-neutral-900/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={trk.coverUrl}
                    alt={trk.title}
                    className="w-11 h-11 rounded-xl object-cover shrink-0 shadow"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${isCurr ? 'text-emerald-400' : 'text-white'}`}>
                      {trk.title}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">{trk.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                    {trk.format}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audioEngine.playHapticClick();
                      onToggleLike(trk.id);
                    }}
                    className="p-1.5 text-neutral-500 hover:text-white"
                  >
                    <Heart className={`w-4 h-4 ${trk.isLiked ? 'text-emerald-400 fill-emerald-400' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
