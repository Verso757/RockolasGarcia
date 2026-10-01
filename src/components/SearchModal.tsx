import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Sparkles, History, Music, Disc3 } from 'lucide-react';
import { PlayedSongRecord } from '../types';
import { sounds } from '../utils/audioEffects';
import { searchYouTubeUniversal } from '../utils/youtubeSearch';
import { SongThumbnail } from './SongThumbnail';

interface SearchModalProps {
  history: PlayedSongRecord[];
  onClose: () => void;
  onAddSong: (song: { videoId: string; title: string; artist?: string; thumbnail?: string; isPriority?: boolean }) => void;
}

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ history, onClose, onAddSong }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions' | 'history'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<YouTubeSearchResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeTab === 'search') {
      inputRef.current?.focus();
    }
  }, [activeTab]);

  // Fetch AI smart recommendations based on what has been played
  const fetchSmartSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (res.ok && data.recommendations) {
        setSuggestions(data.recommendations);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchSmartSuggestions();
  }, []);

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchYouTubeUniversal(term);
      setResults(data);
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 350);
    } else {
      setResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSelectSong = (
    song: { videoId: string; title: string; artist?: string; thumbnail?: string },
    isPriority: boolean
  ) => {
    sounds.playCoinInsert();
    onAddSong({
      videoId: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      isPriority,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-[#1b2029] via-[#13161c] to-[#0c0e12] border-2 border-cyan-500/70 p-4 sm:p-5 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header estilo consola Virtual Music Jukebox */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <h3 className="font-mono text-sm sm:text-base font-black text-white tracking-widest uppercase">
              Buscador YouTube • Rockolas García
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pestañas: Buscar / Sugerencias Inteligentes / Memoria */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-black/80 p-1 border border-gray-800">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition ${
              activeTab === 'search'
                ? 'bg-cyan-500 text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Buscar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('suggestions');
              if (suggestions.length === 0) fetchSmartSuggestions();
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition ${
              activeTab === 'suggestions'
                ? 'bg-cyan-500 text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sugerencias</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Historial</span>
          </button>
        </div>

        {/* Input de Búsqueda */}
        {activeTab === 'search' && (
          <div className="relative mt-3">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe el nombre del cantante, canción o pega un enlace..."
              className="w-full rounded-xl border border-cyan-500/50 bg-black px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none shadow-inner"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              </div>
            )}
          </div>
        )}

        {/* Contenido según pestaña */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {/* Pestaña: Búsqueda */}
          {activeTab === 'search' && (
            <>
              {results.map((song) => (
                <div
                  key={song.videoId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-black/75 p-2.5 hover:border-cyan-500 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <SongThumbnail
                      src={song.thumbnail}
                      videoId={song.videoId}
                      alt={song.title}
                      className="h-11 w-16 rounded-lg object-cover bg-black shrink-0 border border-gray-700"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-cyan-400 font-semibold truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSelectSong(song, false)}
                      className="rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-1.5 text-xs font-black shadow transition active:scale-95"
                    >
                      Poner
                    </button>
                    <button
                      onClick={() => handleSelectSong(song, true)}
                      className="rounded-lg bg-amber-400 hover:bg-amber-300 text-black px-3 py-1.5 text-xs font-black shadow transition active:scale-95"
                    >
                      1° Puesto
                    </button>
                  </div>
                </div>
              ))}

              {!searchQuery.trim() && (
                <div className="py-12 text-center text-xs text-gray-400">
                  <Disc3 className="h-8 w-8 text-cyan-400 mx-auto mb-2 animate-spin [animation-duration:10s]" />
                  Escribe cualquier canción de YouTube para ponerla en la TV.
                </div>
              )}
            </>
          )}

          {/* Pestaña: Sugerencias */}
          {activeTab === 'suggestions' && (
            <>
              {loadingSuggestions ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mx-auto mb-2" />
                  <span className="text-xs text-gray-400">Consultando sugerencias...</span>
                </div>
              ) : (
                suggestions.map((song) => (
                  <div
                    key={song.videoId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-black/75 p-2.5 hover:border-cyan-500 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <SongThumbnail
                        src={song.thumbnail}
                        videoId={song.videoId}
                        alt={song.title}
                        className="h-11 w-16 rounded-lg object-cover bg-black shrink-0 border border-gray-700"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-cyan-400 font-semibold truncate">
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleSelectSong(song, false)}
                        className="rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-1.5 text-xs font-black shadow transition active:scale-95"
                      >
                        Poner
                      </button>
                      <button
                        onClick={() => handleSelectSong(song, true)}
                        className="rounded-lg bg-amber-400 hover:bg-amber-300 text-black px-3 py-1.5 text-xs font-black shadow transition active:scale-95"
                      >
                        1° Puesto
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Pestaña: Historial */}
          {activeTab === 'history' && (
            <>
              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No hay canciones en el historial todavía.
                </div>
              ) : (
                history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-black/75 p-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <SongThumbnail
                        src={record.thumbnail}
                        videoId={record.videoId}
                        alt={record.title}
                        className="h-10 w-14 rounded-lg object-cover bg-black shrink-0 border border-gray-700"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{record.title}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{record.artist}</p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleSelectSong(
                          {
                            videoId: record.videoId,
                            title: record.title,
                            artist: record.artist,
                            thumbnail: record.thumbnail,
                          },
                          false
                        )
                      }
                      className="rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black px-3 py-1.5 text-xs font-black transition active:scale-95"
                    >
                      Repetir
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
