import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DownloadCloud,
  Link as LinkIcon,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  FolderDown,
  Layers,
  ArrowRight,
  Music,
  Upload,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { AudioFormat, BitrateOption, DownloadJob, SourcePlatform, Track } from '../types';
import { QUICK_DEMO_LINKS, SAMPLE_CSV_EXPORTIFY } from '../data/mockCatalog';
import { audioEngine } from '../utils/audioEngine';
import confetti from 'canvas-confetti';

interface DownloaderViewProps {
  jobs: DownloadJob[];
  onStartDownload: (url: string, format: AudioFormat, bitrate: BitrateOption) => void;
  onImportCustomAudio: (file: File) => void;
  onBatchQueueCsv: (csvContent: string) => void;
  onPlayTrack: (track: Track) => void;
}

export const DownloaderView: React.FC<DownloaderViewProps> = ({
  jobs,
  onStartDownload,
  onImportCustomAudio,
  onBatchQueueCsv,
  onPlayTrack,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [format, setFormat] = useState<AudioFormat>('flac');
  const [bitrate, setBitrate] = useState<BitrateOption>('lossless');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState(SAMPLE_CSV_EXPORTIFY);

  // Detect platform from URL
  const detectPlatform = (val: string): SourcePlatform | 'unknown' => {
    if (!val) return 'unknown';
    if (val.includes('spotify.com')) return 'spotify';
    if (val.includes('music.youtube.com') || val.includes('youtube.com') || val.includes('youtu.be')) return 'youtube';
    if (val.includes('soundcloud.com')) return 'soundcloud';
    if (val.endsWith('.csv')) return 'csv';
    return 'unknown';
  };

  const detectedPlatform = detectPlatform(urlInput);

  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    audioEngine.playHapticClick();
    onStartDownload(urlInput.trim(), format, bitrate);
    setUrlInput('');
  };

  const handlePasteClipboard = async () => {
    try {
      audioEngine.playHapticClick();
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
      }
    } catch {
      // Fallback
    }
  };

  const handleQuickDemoClick = (demoUrl: string) => {
    audioEngine.playHapticClick();
    setUrlInput(demoUrl);
  };

  const handleCsvSubmit = () => {
    audioEngine.playHapticClick();
    onBatchQueueCsv(csvText);
    setShowCsvModal(false);
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      audioEngine.playHapticClick();
      onImportCustomAudio(file);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 pt-4 pb-24 space-y-6">
      {/* Downtify Header Badge */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Downtify</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              v2.8 iOS
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span>Spotify Embed</span>
            <span>·</span>
            <span>ytmusicapi</span>
            <span>·</span>
            <span>yt-dlp</span>
            <span>·</span>
            <span>mutagen</span>
          </div>
        </div>

        <button
          onClick={() => {
            audioEngine.playHapticClick();
            setShowCsvModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>CSV Import</span>
        </button>
      </div>

      {/* Main Download Card */}
      <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-4">
        <form onSubmit={handleDownloadSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <label className="font-medium">Music Link or Embed URL</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-medium text-xs"
                >
                  Paste Link
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-neutral-500">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste Spotify track, album, playlist, or YouTube URL..."
                className="w-full pl-10 pr-24 py-3 bg-neutral-950/90 border border-neutral-800 rounded-2xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-all font-mono text-xs sm:text-sm"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="absolute right-14 text-neutral-500 hover:text-neutral-300 text-xs px-2"
                >
                  Clear
                </button>
              )}
              {detectedPlatform !== 'unknown' && (
                <div className="absolute right-3 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-mono font-bold tracking-wider">
                  {detectedPlatform}
                </div>
              )}
            </div>
          </div>

          {/* Format & Bitrate Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {(['mp3', 'flac', 'm4a', 'opus'] as AudioFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    audioEngine.playHapticClick();
                    setFormat(fmt);
                    if (fmt === 'flac') setBitrate('lossless');
                    else if (bitrate === 'lossless') setBitrate('320k');
                  }}
                  className={`px-2.5 py-1 text-xs uppercase font-mono font-medium rounded-lg transition-all ${
                    format === fmt
                      ? 'bg-neutral-800 text-white shadow-sm font-bold border border-white/10'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {format === 'flac' ? (
                <span className="px-3 py-1 text-xs font-mono text-emerald-400 font-semibold">
                  Lossless 24-bit
                </span>
              ) : (
                (['192k', '256k', '320k'] as BitrateOption[]).map((br) => (
                  <button
                    key={br}
                    type="button"
                    onClick={() => {
                      audioEngine.playHapticClick();
                      setBitrate(br);
                    }}
                    className={`px-2 py-1 text-xs font-mono rounded-lg transition-all ${
                      bitrate === br
                        ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {br}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg ${
              urlInput.trim()
                ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20 active:scale-[0.98]'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <DownloadCloud className="w-5 h-5" />
            <span>Download & Tag with Downtify</span>
          </button>
        </form>

        {/* Collapsible Advanced Settings */}
        <div className="border-t border-neutral-800/80 pt-3">
          <button
            type="button"
            onClick={() => {
              audioEngine.playHapticClick();
              setShowAdvanced(!showAdvanced);
            }}
            className="flex items-center justify-between w-full text-xs text-neutral-400 hover:text-neutral-200 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
              Pipeline & Codec Settings
            </span>
            <span className="text-[11px] text-neutral-500">{showAdvanced ? 'Hide' : 'Show'}</span>
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3 pt-1 text-xs"
              >
                <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Embed ID3v2 & Full-res Artwork</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Enabled (mutagen)</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Fetch Synced Lyrics (.lrc)</span>
                    <span className="text-emerald-400 font-mono text-[11px]">LRCLIB API</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Audio Match Engine</span>
                    <span className="text-neutral-400 font-mono text-[11px]">YouTube Music duration diff &lt; 3s</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-800/60">
                    <span className="text-neutral-500 block mb-1">Output Pattern Template:</span>
                    <code className="text-neutral-300 font-mono text-[11px] bg-neutral-900 px-2 py-1 rounded block truncate">
                      ~/Music/{'{artist}'}/{'{album}'}/{'{track_number}'} - {'{title}'}.{format}
                    </code>
                  </div>
                </div>

                {/* Local audio file uploader */}
                <div className="relative flex items-center justify-center p-3 border border-dashed border-neutral-800 hover:border-emerald-500/50 rounded-2xl bg-neutral-950/40 text-center cursor-pointer group transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileDrop}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-xs text-neutral-400 group-hover:text-emerald-400 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Or drop a local audio file to auto-tag with mutagen</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Demo Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase font-mono tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Instant Test Links
          </h2>
          <span className="text-[11px] text-neutral-500">Tap to load link</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {QUICK_DEMO_LINKS.map((demo, idx) => (
            <div
              key={idx}
              onClick={() => handleQuickDemoClick(demo.url)}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 cursor-pointer transition-all active:scale-[0.98] group"
            >
              <img
                src={demo.cover}
                alt={demo.name}
                className="w-11 h-11 rounded-xl object-cover shrink-0 shadow"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <span>{demo.platform}</span>
                  <span>·</span>
                  <span className="text-neutral-500 capitalize">{demo.type}</span>
                </div>
                <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {demo.name}
                </p>
                <p className="text-xs text-neutral-400 truncate">{demo.artist}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white shrink-0 mr-1 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Active Jobs & Download Pipeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase font-mono tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Download Queue & Pipeline ({jobs.length})
          </h2>
          {jobs.some((j) => j.status === 'completed') && (
            <span className="text-[11px] text-emerald-400 font-medium">Auto-saved to Library</span>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900/40 border border-neutral-800/60 rounded-3xl">
            <DownloadCloud className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-400">Queue is empty</p>
            <p className="text-xs text-neutral-600 mt-0.5">
              Paste a link above or tap an instant test link to start downloading.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {jobs.map((job) => {
              const isDone = job.status === 'completed';
              const isFail = job.status === 'failed';

              return (
                <div
                  key={job.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-neutral-900/70 border-emerald-500/20'
                      : isFail
                      ? 'bg-red-950/20 border-red-500/30'
                      : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={job.coverUrl}
                      alt={job.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 shadow"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white truncate">{job.title}</p>
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 pl-2">
                          {isDone ? 'READY' : `${job.progress}%`}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate">{job.artist}</p>

                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span
                          className={`flex items-center gap-1 font-mono ${
                            isDone
                              ? 'text-emerald-400'
                              : isFail
                              ? 'text-red-400'
                              : 'text-neutral-400'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          )}
                          {job.stageLabel}
                        </span>
                        <span className="text-neutral-600">·</span>
                        <span className="text-neutral-500 font-mono uppercase">
                          {job.format} ({job.bitrate})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!isDone && !isFail && (
                    <div className="mt-3 w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}

                  {isDone && job.track && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400 font-mono">
                        Saved: {job.fileSizeMb} MB with ID3v2 tags & lyrics
                      </span>
                      <button
                        onClick={() => {
                          audioEngine.playHapticClick();
                          onPlayTrack(job.track!);
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        Play Now →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSV Bulk Importer Modal */}
      <AnimatePresence>
        {showCsvModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-semibold text-white">Batch CSV Import</h3>
                </div>
                <button
                  onClick={() => setShowCsvModal(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-2 text-xs text-neutral-400">
                <p>
                  Paste CSV export from <strong className="text-neutral-200">Exportify</strong>,{' '}
                  <strong className="text-neutral-200">Soundiiz</strong>, or{' '}
                  <strong className="text-neutral-200">TuneMyMusic</strong>. Downtify will automatically match and download every track!
                </p>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
                  placeholder="Paste CSV data here..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCsvSubmit}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20"
                >
                  Queue Tracks from CSV
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
