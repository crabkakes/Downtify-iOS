import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Tag, Disc, Calendar, Hash, Music2 } from 'lucide-react';
import { Track } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface ID3EditorModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTrack: Track) => void;
}

export const ID3EditorModal: React.FC<ID3EditorModalProps> = ({
  track,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!track || !isOpen) return null;

  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album);
  const [releaseYear, setReleaseYear] = useState(track.releaseYear);
  const [trackNumber, setTrackNumber] = useState(track.trackNumber.toString());
  const [genre, setGenre] = useState(track.genre);
  const [isrc, setIsrc] = useState(track.isrc || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playHapticClick();
    onSave({
      ...track,
      title: title.trim() || track.title,
      artist: artist.trim() || track.artist,
      album: album.trim() || track.album,
      releaseYear: releaseYear.trim() || track.releaseYear,
      trackNumber: parseInt(trackNumber, 10) || track.trackNumber,
      genre: genre.trim() || track.genre,
      isrc: isrc.trim() || track.isrc,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* iOS sheet handle bar */}
          <div className="w-12 h-1.5 bg-neutral-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">ID3v2 Metadata Editor</h3>
                <p className="text-xs text-neutral-400">Powered by mutagen tag engine</p>
              </div>
            </div>
            <button
              onClick={() => {
                audioEngine.playHapticClick();
                onClose();
              }}
              className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 no-scrollbar">
            <div className="flex items-center gap-4 p-3 bg-neutral-950/60 rounded-2xl border border-neutral-800/80">
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-16 h-16 rounded-xl object-cover shadow-md"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">
                  {track.format} · {track.bitrate}
                </span>
                <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                <p className="text-[11px] text-neutral-500 mt-1 font-mono">{track.fileSizeMb} MB</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Track Title</label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Title"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Artist</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Artist"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Album</label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Album"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Year</label>
                  <input
                    type="text"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Track #</label>
                  <input
                    type="number"
                    value={trackNumber}
                    onChange={(e) => setTrackNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Genre</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Pop"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">ISRC Identifier</label>
                <input
                  type="text"
                  value={isrc}
                  onChange={(e) => setIsrc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="USUM71922097"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Save ID3 Tags
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
