import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SongItem, RockolaRoomState, RockolaTheme } from '../types';
import {
  Search,
  ListMusic,
  CheckCircle2,
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Loader2,
  Compass,
  Plus,
  Star,
  Cast,
  Tv,
  ChevronUp,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { sounds } from '../utils/audioEffects';
import { CANTINA_ARTIST_CARDS, CantinaArtistCard, CantinaSong } from '../data/catalogo';
import { searchYouTubeUniversal } from '../utils/youtubeSearch';
import { SongThumbnail } from './SongThumbnail';

interface GuestRequestViewProps {
  roomState: RockolaRoomState;
  onAddSong: (song: Partial<SongItem> & { isPriority?: boolean }) => Promise<boolean | void>;
  onMoveToTop: (songId: string) => void;
  onMoveUp?: (songId: string) => void;
  onMoveDown?: (songId: string) => void;
  onRemoveSong?: (songId: string) => void;
  onReorderQueue?: (fromIndex: number, toIndex: number) => void;
  onPlayNow?: (song: SongItem) => void;
  onPlayPauseToggle: (playing: boolean) => void;
  onNextSong: () => void;
  onSelectTheme?: (theme: RockolaTheme) => void;
  onOpenCast?: () => void;
  onBackToTV?: () => void;
}

interface GenreCategory {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  gradient: string;
  accent: string;
  filterKey: string;
}

const GENRE_CATEGORIES: GenreCategory[] = [
  {
    id: 'rancheras',
    name: 'Rancheras & Mariachi',
    subtitle: 'Vicente Fernández, Pedro Infante, Juan Gabriel',
    icon: '🎺',
    gradient: 'from-amber-950 via-amber-900 to-black',
    accent: '#f59e0b',
    filterKey: 'Rancheras',
  },
  {
    id: 'norteno',
    name: 'Norteño & Banda',
    subtitle: 'Tigres del Norte, Intocable, Nodal, Grupo Frontera',
    icon: '🤠',
    gradient: 'from-stone-900 via-orange-950 to-black',
    accent: '#ea580c',
    filterKey: 'Norteño',
  },
  {
    id: 'cumbias',
    name: 'Cumbias & Fiesta',
    subtitle: 'Ángeles Azules, Selena, Sonora Dinamita',
    icon: '💃',
    gradient: 'from-emerald-950 via-teal-950 to-black',
    accent: '#10b981',
    filterKey: 'Cumbias',
  },
  {
    id: 'rock_pop',
    name: 'Pop & Rock en Español',
    subtitle: 'Juanes, Soda Stereo, Maná, Shakira',
    icon: '🎸',
    gradient: 'from-cyan-950 via-blue-950 to-black',
    accent: '#06b6d4',
    filterKey: 'Pop / Rock',
  },
  {
    id: 'oldies_ingles',
    name: 'Oldies & Clásicos en Inglés',
    subtitle: 'Queen, The Beatles, Michael Jackson, 60s, 70s y 80s',
    icon: '📻',
    gradient: 'from-blue-950 via-indigo-950 to-black',
    accent: '#38bdf8',
    filterKey: 'Oldies & Inglés',
  },
  {
    id: 'canciones_tristes',
    name: 'Canciones Tristes & Despecho',
    subtitle: 'Paquita la del Barrio, José Alfredo, Pa\' llorar y dolidos',
    icon: '💔',
    gradient: 'from-red-950 via-rose-950 to-black',
    accent: '#ef4444',
    filterKey: 'Canciones Tristes',
  },
  {
    id: 'himnos_alegria',
    name: 'Himnos de la Alegría & Fiesta',
    subtitle: 'Mi Banda El Mexicano, El Noa Noa, Baila esta cumbia',
    icon: '🎉',
    gradient: 'from-yellow-950 via-amber-950 to-black',
    accent: '#eab308',
    filterKey: 'Himnos de la Alegría',
  },
  {
    id: 'urbano',
    name: 'Urbano & Reggaeton',
    subtitle: 'Don Omar, Daddy Yankee, Bad Bunny',
    icon: '🔥',
    gradient: 'from-purple-950 via-fuchsia-950 to-black',
    accent: '#a855f7',
    filterKey: 'Urbano',
  },
  {
    id: 'baladas',
    name: 'Baladas del Recuerdo',
    subtitle: 'José José, Raphael, Los Bukis, Luis Miguel',
    icon: '🌹',
    gradient: 'from-pink-950 via-rose-950 to-black',
    accent: '#f43f5e',
    filterKey: 'Baladas',
  },
  {
    id: 'boleros',
    name: 'Boleros de Cantina',
    subtitle: 'Julio Jaramillo, Los Panchos, Bohemia',
    icon: '🎷',
    gradient: 'from-amber-950 via-yellow-950 to-black',
    accent: '#d97706',
    filterKey: 'Boleros',
  },
  {
    id: 'todos',
    name: 'Ver Todos los Discos',
    subtitle: 'Explorar todo el catálogo completo de la rockola',
    icon: '💿',
    gradient: 'from-gray-800 via-gray-900 to-black',
    accent: '#22d3ee',
    filterKey: 'TODOS',
  },
];

export const GuestRequestView: React.FC<GuestRequestViewProps> = ({
  roomState,
  onAddSong,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onRemoveSong,
  onReorderQueue,
  onPlayNow,
  onPlayPauseToggle,
  onNextSong,
  onOpenCast,
  onBackToTV,
}) => {
  // Navigation View: 'home' (Queue & Search) | 'genres' (Big Genre Cards) | 'disco_wall' (Artist Discs)
  const [currentView, setCurrentView] = useState<'home' | 'genres' | 'disco_wall'>('home');
  const [activeGenre, setActiveGenre] = useState<GenreCategory>(GENRE_CATEGORIES[0]);

  // YouTube live search input
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytSearchResults, setYtSearchResults] = useState<
    Array<{ videoId: string; title: string; artist: string; thumbnail: string }>
  >([]);

  // Dynamically created custom artists
  const [dynamicArtists, setDynamicArtists] = useState<CantinaArtistCard[]>(() => {
    try {
      const stored = localStorage.getItem('virtual_jukebox_custom_artists');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [customArtistInput, setCustomArtistInput] = useState('');
  const [isAddingCustomArtist, setIsAddingCustomArtist] = useState(false);

  // Notification toast
  const [notification, setNotification] = useState<string | null>(null);
  const [activeSongPrompt, setActiveSongPrompt] = useState<CantinaSong | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter artists according to active genre
  const filteredArtists = useMemo(() => {
    const combined = [...CANTINA_ARTIST_CARDS, ...dynamicArtists];
    if (activeGenre.filterKey === 'TODOS') return combined;
    return combined.filter(
      (a) =>
        a.genre.toLowerCase().includes(activeGenre.filterKey.toLowerCase()) ||
        a.songs.some((s) => s.genre?.toLowerCase().includes(activeGenre.filterKey.toLowerCase()))
    );
  }, [dynamicArtists, activeGenre]);

  // Save custom dynamic artist
  const persistDynamicArtists = (newList: CantinaArtistCard[]) => {
    setDynamicArtists(newList);
    try {
      localStorage.setItem('virtual_jukebox_custom_artists', JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  // YouTube Live Search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setYtSearchResults([]);
      return;
    }
    setIsSearchingYt(true);
    try {
      const results = await searchYouTubeUniversal(query);
      setYtSearchResults(results);
    } catch {
      // ignore
    } finally {
      setIsSearchingYt(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 350);
    } else {
      setYtSearchResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSelectTrack = (song: CantinaSong) => {
    sounds.playButtonTick();
    setActiveSongPrompt(song);
  };

  const handleConfirmAddSong = async (song: CantinaSong, isPriority = false) => {
    sounds.playCoinInsert();
    setActiveSongPrompt(null);

    await onAddSong({
      videoId: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnail: `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`,
      isPriority,
    });

    setNotification(
      isPriority
        ? `⭐ [${song.code}] ¡Pasó al 1° puesto!: ${song.title}`
        : `🎵 [${song.code}] ¡Agregada a la lista!: ${song.title}`
    );
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddYouTubeResult = async (video: { videoId: string; title: string; artist: string }, isPriority = false) => {
    sounds.playCoinInsert();
    await onAddSong({
      videoId: video.videoId,
      title: video.title,
      artist: video.artist,
      thumbnail: `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
      isPriority,
    });

    setNotification(
      isPriority
        ? `⭐ ¡Pasó al 1° puesto!: ${video.title}`
        : `🎶 ¡Agregada a la lista!: ${video.title}`
    );
    setTimeout(() => setNotification(null), 3000);
  };

  // Add custom artist to active genre
  const handleCreateArtistDisc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customArtistInput.trim()) return;

    setIsAddingCustomArtist(true);
    sounds.playButtonTick();

    try {
      const results = await searchYouTubeUniversal(`${customArtistInput.trim()} exitos`);
      if (results && results.length >= 3) {
        const currentHighestCode = Math.max(
          180,
          ...[...CANTINA_ARTIST_CARDS, ...dynamicArtists].flatMap((a) =>
            a.songs.map((s) => parseInt(s.code, 10) || 0)
          )
        );

        const songs: CantinaSong[] = results.slice(0, 7).map((item, idx) => ({
          code: String(currentHighestCode + idx + 1).padStart(3, '0'),
          title: item.title.replace(/\(.*?\)|\[.*?\]/g, '').trim() || 'Canción',
          artist: customArtistInput.trim(),
          videoId: item.videoId,
          genre: activeGenre.filterKey === 'TODOS' ? 'Variado' : activeGenre.filterKey,
        }));

        const newCard: CantinaArtistCard = {
          id: `dyn_${customArtistInput.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          name: customArtistInput.trim().toUpperCase(),
          genre: activeGenre.filterKey === 'TODOS' ? 'Variado' : activeGenre.filterKey,
          image: results[0].thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
          songs,
        };

        persistDynamicArtists([newCard, ...dynamicArtists]);
        setCustomArtistInput('');
        setNotification(`💿 ¡Disco de ${newCard.name} añadido a la rockola!`);
      }
    } finally {
      setIsAddingCustomArtist(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1014] text-white flex flex-col font-sans select-none pb-20">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-black text-black shadow-2xl animate-in fade-in slide-in-from-top-3 border border-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* HEADER SUPERIOR CON BOTÓN "ENVIAR A TV" Y "NAVEGAR DISCOS" */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[#222630] to-[#161820] border-b-2 border-gray-700 px-3 py-2 shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {onBackToTV && (
              <button
                onClick={onBackToTV}
                className="flex items-center gap-1 rounded bg-[#2b303d] border border-gray-600 px-2.5 py-1 text-xs font-bold text-gray-200 hover:bg-[#383e4f] transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ver TV</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 truncate">
              <span className="text-lg">📻</span>
              <div>
                <h1 className="text-xs sm:text-sm font-black tracking-widest uppercase text-cyan-400 font-mono truncate">
                  ROCKOLAS GARCÍA
                </h1>
                <span className="text-[10px] text-gray-400 block -mt-0.5">
                  Control & Pedidos Móvil
                </span>
              </div>
            </div>
          </div>

          {/* ACCIONES: ENVIAR A TV & NAVEGAR */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* BOTÓN ENVIAR A TV EN CELULAR */}
            {onOpenCast && (
              <button
                onClick={() => {
                  sounds.playButtonTick();
                  onOpenCast();
                }}
                className="flex items-center gap-1 rounded-xl bg-gray-800 hover:bg-gray-700 border border-cyan-500/60 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-cyan-300 shadow active:scale-95 transition"
                title="Conectar o enviar a la TV"
              >
                <Tv className="h-3.5 w-3.5 text-cyan-400" />
                <span>Enviar a TV</span>
              </button>
            )}

            {/* BOTÓN NAVEGAR DESTACADO */}
            {currentView === 'home' ? (
              <button
                onClick={() => {
                  sounds.playButtonTick();
                  setCurrentView('genres');
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:brightness-110 text-black px-3 py-1.5 text-xs font-black shadow-lg transition active:scale-95 animate-pulse"
              >
                <Compass className="h-4 w-4 text-black" />
                <span>NAVEGAR ➔</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playButtonTick();
                  setCurrentView('home');
                }}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-black text-black transition active:scale-95"
              >
                <ListMusic className="h-4 w-4" />
                <span>VER COLA ({roomState.queue.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* VISTA 1: HOME (COLA DE REPRODUCCIÓN + BUSCADOR YOUTUBE DIRECTO)           */}
      {/* ========================================================================= */}
      {currentView === 'home' && (
        <main className="mx-auto w-full max-w-4xl flex-1 p-3 sm:p-4 space-y-3.5">
          {/* BANNER AHORA SONANDO EN LA TV */}
          {roomState.currentSong ? (
            <div className="rounded-2xl border-2 border-cyan-500/60 bg-gradient-to-r from-[#172533] via-[#0f1720] to-[#0a1017] p-3 shadow-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <SongThumbnail
                  src={roomState.currentSong.thumbnail}
                  videoId={roomState.currentSong.videoId}
                  alt={roomState.currentSong.title}
                  className="h-12 w-16 rounded-xl object-cover bg-black shrink-0 border border-cyan-500/50 shadow"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">
                      SONANDO EN LA TV
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-white truncate">
                    {roomState.currentSong.title}
                  </h3>
                  <p className="text-[11px] text-cyan-300 font-semibold truncate">
                    {roomState.currentSong.artist}
                  </p>
                </div>
              </div>

              {/* Controles de reproducción rápida en TV */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onPlayPauseToggle(!roomState.isPlaying)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black shadow active:scale-95 transition"
                  title={roomState.isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {roomState.isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                </button>
                <button
                  onClick={onNextSong}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 active:scale-95 transition"
                  title="Siguiente canción"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-3.5 text-center">
              <span className="text-2xl mb-1 inline-block">📻</span>
              <h3 className="text-xs font-bold text-gray-300">La TV está en espera</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Busca una canción abajo o pulsa «Navegar» para explorar discos por género.
              </p>
            </div>
          )}

          {/* BUSCADOR DIRECTO DE YOUTUBE */}
          <div className="rounded-2xl border-2 border-cyan-500/70 bg-gradient-to-b from-[#1b2029] to-[#12151b] p-3.5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs sm:text-sm font-black uppercase text-cyan-300 flex items-center gap-2 font-mono">
                <Search className="h-4 w-4 text-cyan-400" />
                Buscador de Cualquier Canción (YouTube)
              </h2>
              <span className="text-[10px] text-gray-400 font-sans">
                Escribe cantante o tema
              </span>
            </div>

            {/* Input de Búsqueda */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca por cantante, tema o pega un link..."
                className="w-full rounded-xl border border-cyan-500/50 bg-black/90 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none shadow-inner"
              />
              {isSearchingYt && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                </div>
              )}
            </div>

            {/* Resultados de búsqueda instantáneos */}
            {ytSearchResults.length > 0 && (
              <div className="mt-2.5 space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin border-t border-gray-800 pt-2">
                {ytSearchResults.map((video) => (
                  <div
                    key={video.videoId}
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-gray-800 bg-black/75 p-2 hover:border-cyan-500 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <SongThumbnail
                        src={video.thumbnail}
                        videoId={video.videoId}
                        alt={video.title}
                        className="h-10 w-14 rounded object-cover bg-black shrink-0 border border-gray-700"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{video.title}</h4>
                        <p className="text-[11px] text-gray-400 truncate">{video.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAddYouTubeResult(video, false)}
                        className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-black text-black active:scale-95 transition"
                      >
                        Poner
                      </button>
                      <button
                        onClick={() => handleAddYouTubeResult(video, true)}
                        className="rounded-lg bg-amber-400 hover:bg-amber-300 px-3 py-1.5 text-xs font-black text-black active:scale-95 transition"
                      >
                        1° Puesto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LISTA DE REPRODUCCIÓN (COLA EN ESPERA) - DIRECTAMENTE DEBAJO SIN BLOQUES DUPLICADOS */}
          <div className="rounded-2xl border-2 border-gray-700 bg-gradient-to-b from-[#181a20] to-[#0f1115] p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
              <h2 className="text-xs sm:text-sm font-black uppercase text-white flex items-center gap-2 font-mono">
                <ListMusic className="h-4 w-4 text-cyan-400" />
                Lista de Reproducción en Espera ({roomState.queue.length})
              </h2>
              <span className="text-[10px] text-cyan-400/80 font-mono">
                EN VIVO
              </span>
            </div>

            {roomState.queue.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <span className="text-3xl mb-2 inline-block">🎶</span>
                <p className="text-sm font-bold text-gray-300">
                  No hay canciones en la lista
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  ¡Sé el primero en pedir música! Escribe en el buscador de arriba o toca «Navegar» para ver discos.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {roomState.queue.map((song, idx) => (
                  <div
                    key={song.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-gray-800 bg-black/70 p-2.5 hover:border-gray-700 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Selector directo de turno o número */}
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={idx + 1}
                          onChange={(e) => {
                            sounds.playButtonTick();
                            const targetIdx = Number(e.target.value) - 1;
                            if (targetIdx !== idx) {
                              onReorderQueue?.(idx, targetIdx);
                            }
                          }}
                          className="font-mono text-xs font-black text-cyan-300 bg-gray-900 border border-gray-700 rounded px-1 py-1 cursor-pointer hover:border-cyan-500 focus:outline-none"
                          title="Cambiar turno en la lista"
                        >
                          {roomState.queue.map((_, i) => (
                            <option key={i} value={i + 1}>
                              #{i + 1}
                            </option>
                          ))}
                        </select>
                      </div>

                      <SongThumbnail
                        src={song.thumbnail}
                        videoId={song.videoId}
                        alt={song.title}
                        className="h-10 w-14 rounded object-cover bg-black shrink-0 border border-gray-800"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{song.title}</h4>
                        <p className="text-[11px] text-gray-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    {/* Botonera de acciones para mover el orden y reproducir */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Poner de primero */}
                      {idx > 0 && (
                        <button
                          onClick={() => {
                            sounds.playButtonTick();
                            onMoveToTop(song.id);
                          }}
                          className="flex items-center gap-1 rounded-lg bg-amber-400 hover:bg-amber-300 px-2 py-1 text-[10px] font-black text-black active:scale-95 transition"
                          title="Poner de primero en la fila"
                        >
                          <Star className="h-3 w-3 fill-current" />
                          <span>1° Puesto</span>
                        </button>
                      )}

                      {/* Subir un turno */}
                      <button
                        disabled={idx === 0}
                        onClick={() => {
                          sounds.playButtonTick();
                          onMoveUp?.(song.id);
                        }}
                        className={`rounded-lg border p-1 text-xs transition active:scale-95 ${
                          idx === 0
                            ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                            : 'border-gray-700 bg-gray-900 text-cyan-400 hover:bg-gray-800'
                        }`}
                        title="Subir un turno arriba"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>

                      {/* Bajar un turno */}
                      <button
                        disabled={idx === roomState.queue.length - 1}
                        onClick={() => {
                          sounds.playButtonTick();
                          onMoveDown?.(song.id);
                        }}
                        className={`rounded-lg border p-1 text-xs transition active:scale-95 ${
                          idx === roomState.queue.length - 1
                            ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                            : 'border-gray-700 bg-gray-900 text-cyan-400 hover:bg-gray-800'
                        }`}
                        title="Bajar un turno abajo"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>

                      {/* Tocar ahora mismo */}
                      {onPlayNow && (
                        <button
                          onClick={() => {
                            sounds.playNeedleDrop();
                            onPlayNow(song);
                          }}
                          className="flex items-center gap-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-2 py-1 text-[10px] font-black text-white active:scale-95 transition"
                          title="Reproducir ahora mismo"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Tocar ya</span>
                        </button>
                      )}

                      {/* Quitar de la lista */}
                      {onRemoveSong && (
                        <button
                          onClick={() => {
                            sounds.playButtonTick();
                            onRemoveSong(song.id);
                          }}
                          className="rounded-lg border border-red-900/50 bg-red-950/30 p-1 text-red-400 hover:bg-red-900/50 transition active:scale-95"
                          title="Quitar de la lista"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: NAVEGAR CUADROS GRANDES CON GÉNEROS (INCLUYE OLDIES, TRISTES...) */}
      {/* ========================================================================= */}
      {currentView === 'genres' && (
        <main className="mx-auto w-full max-w-4xl flex-1 p-3 sm:p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2">
            <button
              onClick={() => {
                sounds.playButtonTick();
                setCurrentView('home');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-600 bg-gray-800 px-3.5 py-1.5 text-xs font-black text-cyan-300 hover:bg-gray-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>VOLVER A LA LISTA</span>
            </button>

            <span className="font-mono text-xs font-bold text-gray-400">
              GÉNEROS MUSICALES
            </span>
          </div>

          <div className="text-center py-1">
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              Selecciona un Género de Rockola
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Toca un recuadro para abrir los discos y las canciones de ese estilo.
            </p>
          </div>

          {/* CUADRÍCULA DE CUADROS GRANDES DE GÉNEROS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GENRE_CATEGORIES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => {
                  sounds.playButtonTick();
                  setActiveGenre(genre);
                  setCurrentView('disco_wall');
                }}
                className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200 shadow-xl hover:scale-[1.02] active:scale-95 bg-gradient-to-br ${genre.gradient} border-gray-700 hover:border-cyan-400 group`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <span className="text-3xl sm:text-4xl group-hover:scale-110 transition duration-300">
                    {genre.icon}
                  </span>
                  <span className="text-[11px] font-black uppercase text-cyan-300 border border-cyan-500/40 bg-black/60 px-2 py-0.5 rounded">
                    ABRIR DISCOS ➔
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide group-hover:text-cyan-300 transition">
                  {genre.name}
                </h3>
                <p className="text-xs text-gray-300 mt-0.5 line-clamp-2">
                  {genre.subtitle}
                </p>
              </button>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: DISCOS DEL GÉNERO SELECCIONADO (VIRTUAL MUSIC JUKEBOX 2X2)       */}
      {/* ========================================================================= */}
      {currentView === 'disco_wall' && (
        <main className="mx-auto w-full max-w-5xl flex-1 p-2 sm:p-4 space-y-3">
          {/* Barra de control para regresar a géneros o a lista */}
          <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2">
            <button
              onClick={() => {
                sounds.playButtonTick();
                setCurrentView('genres');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-600 bg-gray-800 px-3 py-1.5 text-xs font-black text-cyan-300 hover:bg-gray-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>GÉNEROS</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xl">{activeGenre.icon}</span>
              <span className="font-mono text-xs font-black uppercase text-white truncate">
                {activeGenre.name} ({filteredArtists.length} Discos)
              </span>
            </div>

            <button
              onClick={() => {
                sounds.playButtonTick();
                setCurrentView('home');
              }}
              className="rounded-xl border border-cyan-500/50 bg-cyan-950 px-3 py-1.5 text-xs font-black text-cyan-300 hover:text-white transition"
            >
              VER COLA ({roomState.queue.length})
            </button>
          </div>

          {/* Formulario para agregar cantante nuevo al género */}
          <form
            onSubmit={handleCreateArtistDisc}
            className="flex items-center gap-1.5 bg-black/60 p-2 rounded-xl border border-gray-800"
          >
            <input
              type="text"
              value={customArtistInput}
              onChange={(e) => setCustomArtistInput(e.target.value)}
              placeholder={`¿Falta un cantante de ${activeGenre.name}? Escríbelo aquí...`}
              className="flex-1 rounded-lg border border-gray-700 bg-black px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isAddingCustomArtist || !customArtistInput.trim()}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black px-3 py-1.5 text-xs font-black shadow transition shrink-0"
            >
              {isAddingCustomArtist ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Crear Disco</span>
            </button>
          </form>

          {/* EL GABINETE METÁLICO CROMADO CON LOS DISCOS DEL GÉNERO */}
          <div className="relative rounded-2xl border-4 sm:border-8 border-[#9ca3af] p-2 sm:p-4 shadow-2xl bg-gradient-to-b from-[#6b7280] via-[#374151] to-[#1f2937]">
            {/* Tornillos en las 4 esquinas */}
            <div className="absolute top-2 left-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-gray-200 to-gray-600 border border-gray-400 flex items-center justify-center text-[8px] font-mono text-gray-700 shadow font-bold">
              +
            </div>
            <div className="absolute top-2 right-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-gray-200 to-gray-600 border border-gray-400 flex items-center justify-center text-[8px] font-mono text-gray-700 shadow font-bold">
              +
            </div>
            <div className="absolute bottom-2 left-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-gray-200 to-gray-600 border border-gray-400 flex items-center justify-center text-[8px] font-mono text-gray-700 shadow font-bold">
              +
            </div>
            <div className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-gray-200 to-gray-600 border border-gray-400 flex items-center justify-center text-[8px] font-mono text-gray-700 shadow font-bold">
              +
            </div>

            {/* Marco Interior de Monitor CRT */}
            <div className="rounded-xl bg-black p-2 sm:p-3 border-2 border-gray-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              {/* CUADRÍCULA DE DISCOS Y CANCIONES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
                {filteredArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex border-2 border-[#374151] bg-black rounded overflow-hidden shadow-lg hover:border-cyan-500/70 transition-all duration-200"
                  >
                    {/* FOTO DEL ARTISTA / CARÁTULA A LA IZQUIERDA */}
                    <div className="w-[38%] sm:w-[35%] shrink-0 relative bg-[#0a0a0a] flex items-center justify-center border-r-2 border-[#374151] overflow-hidden">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* COLUMNA DERECHA: BANNER BLANCO CON NOMBRE + LISTA DE CANCIONES */}
                    <div className="w-[62%] sm:w-[65%] flex flex-col bg-black">
                      {/* Banner Blanco con Nombre del Artista */}
                      <div className="bg-white text-black px-2 py-1 text-center font-black tracking-wider text-xs sm:text-sm font-sans uppercase border-b-2 border-black truncate">
                        {artist.name}
                      </div>

                      {/* Lista de Canciones con Códigos 001, 002... */}
                      <div className="flex-1 p-1 sm:p-1.5 flex flex-col justify-between text-[11px] sm:text-xs">
                        {artist.songs.map((song) => (
                          <button
                            key={song.code + song.title}
                            onClick={() => handleSelectTrack(song)}
                            className="flex items-center gap-2 px-1.5 py-0.5 sm:py-1 rounded text-left hover:bg-cyan-950/80 active:bg-cyan-800 transition group border border-transparent hover:border-cyan-500/50"
                          >
                            <span className="font-mono font-bold text-cyan-400 group-hover:text-cyan-200 shrink-0">
                              {song.code}
                            </span>
                            <span className="font-bold text-gray-100 group-hover:text-white truncate">
                              {song.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* TEXTO INFERIOR EMBOSSED VIRTUAL MUSIC JUKEBOX */}
              <div className="mt-3 text-center">
                <span className="font-mono text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-cyan-500/70 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                  VIRTUAL MUSIC JUKEBOX
                </span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* MODAL DIÁLOGO DE ACCIÓN AL TOCAR CUALQUIER CANCIÓN */}
      {activeSongPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border-2 border-cyan-400 bg-gradient-to-b from-[#1e232d] to-[#111317] p-5 shadow-2xl text-center">
            <span className="font-mono text-2xl font-black text-cyan-400 bg-black px-3 py-1 rounded border border-cyan-600">
              {activeSongPrompt.code}
            </span>

            <h3 className="font-bold text-base text-white mt-3 leading-tight">
              {activeSongPrompt.title}
            </h3>
            <p className="text-xs text-gray-300 mt-1 font-semibold">{activeSongPrompt.artist}</p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleConfirmAddSong(activeSongPrompt, false)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#262c38] hover:bg-[#323a4a] border border-cyan-500/60 py-3 text-xs font-black text-cyan-300 transition active:scale-95"
              >
                <span>➕ PONER</span>
              </button>

              <button
                onClick={() => handleConfirmAddSong(activeSongPrompt, true)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 py-3 text-xs font-black text-black shadow-lg transition active:scale-95"
              >
                <span>⭐ 1° PUESTO</span>
              </button>
            </div>

            <button
              onClick={() => setActiveSongPrompt(null)}
              className="mt-3 text-xs text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
