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
  Tv,
  ChevronUp,
  ChevronDown,
  Trash2,
  X,
  Sparkles,
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
    subtitle: 'Queen, Pink Floyd, The Beatles, Michael Jackson',
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
    name: 'Ver Todo el Repertorio',
    subtitle: 'Catálogo completo sin restricciones',
    icon: '🎶',
    gradient: 'from-gray-800 via-gray-900 to-black',
    accent: '#22d3ee',
    filterKey: 'TODOS',
  },
];

const QUICK_SEARCH_PILLS = [
  { label: '🎺 Mariachi', query: 'mariachi clasicos' },
  { label: '🤠 Norteño', query: 'norteño fiesta' },
  { label: '💃 Cumbias', query: 'cumbias para bailar' },
  { label: '🎸 Rock en Español', query: 'rock en español 80s 90s' },
  { label: '📻 Rock Clásico', query: 'classic rock hits' },
  { label: '🎤 Baladas', query: 'baladas del recuerdo' },
  { label: '⭐ Juan Gabriel', query: 'juan gabriel exitos' },
  { label: '🍻 Cantina', query: 'canciones de cantina' },
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
  // Navigation View: 'home' (Queue & Quick Search) | 'search' (Full YouTube Search) | 'genres' (Genre Cards) | 'disco_wall' (Artist Discs)
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'genres' | 'disco_wall'>('home');
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Focus search input when switching to search view
  useEffect(() => {
    if (currentView === 'search') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [currentView]);

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

  const handleConfirmAddSong = async (song: CantinaSong, isPriority: boolean) => {
    sounds.playCoinInsert();
    setActiveSongPrompt(null);
    await onAddSong({
      title: song.title,
      artist: song.artist,
      videoId: song.videoId,
      isPriority,
    });
    setNotification(
      isPriority
        ? `⭐ ¡"${song.title}" puesta de 1° puesto!`
        : `🎵 "${song.title}" agregada a la lista`
    );
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddYouTubeResult = async (
    video: { videoId: string; title: string; artist: string; thumbnail: string },
    isPriority: boolean
  ) => {
    sounds.playCoinInsert();
    await onAddSong({
      videoId: video.videoId,
      title: video.title,
      artist: video.artist,
      thumbnail: video.thumbnail,
      isPriority,
    });
    setNotification(
      isPriority
        ? `⭐ ¡"${video.title}" puesta de 1° puesto!`
        : `🎵 "${video.title}" agregada a la lista`
    );
    setTimeout(() => setNotification(null), 3500);
  };

  // Custom artist disc creation
  const handleCreateArtistDisc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customArtistInput.trim()) return;

    sounds.playButtonTick();
    setIsAddingCustomArtist(true);

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
    <div className="min-h-screen bg-[#0a0c10] text-white flex flex-col font-sans select-none pb-32">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 inset-x-4 max-w-sm mx-auto z-50 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-xs font-black text-black shadow-2xl animate-in fade-in slide-in-from-top-3 border border-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="truncate">{notification}</span>
        </div>
      )}

      {/* HEADER SUPERIOR LIMPIO */}
      <header className="sticky top-0 z-40 bg-[#12151d]/95 backdrop-blur-md border-b border-gray-800 px-3.5 py-2.5 shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          {/* Logo y estado */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">📻</span>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black tracking-wider uppercase text-cyan-400 font-mono truncate">
                ROCKOLAS GARCÍA
              </h1>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-gray-400 font-mono">Control en Vivo</span>
              </div>
            </div>
          </div>

          {/* Acciones de TV */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenCast && (
              <button
                onClick={() => {
                  sounds.playButtonTick();
                  onOpenCast();
                }}
                className="flex items-center gap-1 rounded-xl bg-gray-900 border border-cyan-500/40 px-2.5 py-1.5 text-[11px] font-bold text-cyan-300 active:scale-95 transition"
                title="Transmitir a la TV"
              >
                <Tv className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden xs:inline">Conectar TV</span>
              </button>
            )}

            {onBackToTV && (
              <button
                onClick={() => {
                  sounds.playButtonTick();
                  onBackToTV();
                }}
                className="flex items-center gap-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-2.5 py-1.5 text-[11px] font-black active:scale-95 transition"
                title="Abrir pantalla de la TV"
              >
                <span>Ver TV</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* VISTA 1: COLA DE REPRODUCCIÓN & CONTROL EN VIVO                            */}
      {/* ========================================================================= */}
      {currentView === 'home' && (
        <main className="mx-auto w-full max-w-2xl flex-1 p-3.5 space-y-4">
          {/* BANNER AHORA SONANDO EN LA TELE */}
          {roomState.currentSong ? (
            <div className="rounded-2xl border-2 border-cyan-500/60 bg-gradient-to-r from-[#142332] via-[#0f1722] to-[#0a1017] p-3.5 shadow-xl">
              <div className="flex items-center gap-3">
                <SongThumbnail
                  src={roomState.currentSong.thumbnail}
                  videoId={roomState.currentSong.videoId}
                  alt={roomState.currentSong.title}
                  className="h-14 w-20 rounded-xl object-cover bg-black shrink-0 border border-cyan-400/50 shadow"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">
                      {roomState.isPlaying ? 'SONANDO EN LA TV' : 'PAUSADO EN LA TV'}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white truncate leading-tight">
                    {roomState.currentSong.title}
                  </h3>
                  <p className="text-xs text-cyan-300 font-semibold truncate mt-0.5">
                    {roomState.currentSong.artist}
                  </p>
                </div>
              </div>

              {/* Botones de Control Principal de la TV */}
              <div className="mt-3 pt-2.5 border-t border-cyan-900/40 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    sounds.playButtonTick();
                    onPlayPauseToggle(!roomState.isPlaying);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition active:scale-95 shadow ${
                    roomState.isPlaying
                      ? 'bg-amber-400 hover:bg-amber-300 text-black'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  }`}
                >
                  {roomState.isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 fill-current" />
                      <span>PAUSAR TV</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>REANUDAR TV</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    sounds.playButtonTick();
                    onNextSong();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-cyan-300 font-black text-xs transition active:scale-95"
                >
                  <SkipForward className="h-4 w-4" />
                  <span>SIGUIENTE</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-800 bg-[#12141c] p-4 text-center">
              <span className="text-3xl mb-1 inline-block">📻</span>
              <h3 className="text-sm font-bold text-gray-200">La TV está esperando música</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Toca abajo para buscar tu canción favorita y poner a sonar la rockola.
              </p>
              <button
                onClick={() => setCurrentView('search')}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-4 py-2 shadow transition active:scale-95"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Buscar canción en YouTube</span>
              </button>
            </div>
          )}

          {/* ACCESO RÁPIDO AL BUSCADOR */}
          <div
            onClick={() => setCurrentView('search')}
            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-700 bg-[#141822] px-4 py-3 cursor-pointer hover:border-cyan-400 transition shadow group"
          >
            <div className="flex items-center gap-2.5 text-gray-400 group-hover:text-gray-200">
              <Search className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-medium">¿Qué canción quieres escuchar? Buscar...</span>
            </div>
            <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
              Abrir
            </span>
          </div>

          {/* LISTA DE REPRODUCCIÓN (COLA EN ESPERA) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs sm:text-sm font-black uppercase text-white flex items-center gap-2 font-mono">
                <ListMusic className="h-4 w-4 text-cyan-400" />
                <span>Canciones en Fila ({roomState.queue.length})</span>
              </h2>
              {roomState.queue.length > 0 && (
                <span className="text-[11px] font-mono text-cyan-400">
                  {roomState.queue.length} por sonar
                </span>
              )}
            </div>

            {roomState.queue.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-[#101218] py-10 px-4 text-center">
                <span className="text-3xl mb-2 inline-block">🎶</span>
                <p className="text-sm font-bold text-gray-300">
                  No hay más canciones en la fila
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  ¡Sé el primero en pedir! Usa el buscador o explora discos por artista.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentView('search')}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3.5 py-2 text-xs font-black text-black active:scale-95 transition"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Buscar YouTube</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('genres')}
                    className="flex items-center gap-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 px-3.5 py-2 text-xs font-bold text-cyan-300 border border-gray-700 active:scale-95 transition"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Explorar Discos</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {roomState.queue.map((song, idx) => (
                  <div
                    key={song.id}
                    className={`rounded-2xl border p-3 transition-all shadow-md ${
                      idx === 0
                        ? 'border-amber-500/70 bg-gradient-to-br from-[#1c180e] via-[#14120f] to-[#0c0d11] shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
                        : 'border-gray-800 bg-[#12141a] hover:border-gray-700'
                    }`}
                  >
                    {/* Fila Superior: Badge de Turno y Selector Directo de Posición */}
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-800/80">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {idx === 0 ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-black text-black uppercase tracking-wider font-mono shadow">
                            <Star className="h-3 w-3 fill-current" />
                            <span>1° EN TURNO (Siguiente)</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-gray-800 border border-gray-700 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300 font-mono">
                            <span>Turno #{idx + 1}</span>
                          </span>
                        )}
                        {song.isFirstPriority && idx > 0 && (
                          <span className="rounded bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                            Prioridad
                          </span>
                        )}
                      </div>

                      {/* Selector directo para mover de turno */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400 font-mono">Mover a:</span>
                        <select
                          value={idx + 1}
                          onChange={(e) => {
                            sounds.playButtonTick();
                            const targetIdx = Number(e.target.value) - 1;
                            if (targetIdx !== idx) {
                              onReorderQueue?.(idx, targetIdx);
                            }
                          }}
                          className="font-mono text-xs font-black text-cyan-300 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 cursor-pointer hover:border-cyan-400 focus:outline-none"
                          title="Cambiar turno de esta canción"
                        >
                          {roomState.queue.map((_, i) => (
                            <option key={i} value={i + 1}>
                              Turno #{i + 1} {i === 0 ? '(1°)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fila Central: Miniatura + Título + Artista */}
                    <div className="flex items-center gap-3">
                      <SongThumbnail
                        src={song.thumbnail}
                        videoId={song.videoId}
                        alt={song.title}
                        className="h-12 w-16 sm:h-14 sm:w-20 rounded-xl object-cover bg-black shrink-0 border border-gray-700 shadow"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight">
                          {song.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-cyan-400 font-semibold truncate mt-0.5">
                          {song.artist}
                        </p>
                        {song.requestedBy && (
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">
                            Pedida por: <span className="text-gray-400">{song.requestedBy}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Fila Inferior: Botones de Acción Táctiles y Grandes */}
                    <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between gap-1.5">
                      {/* Izquierda: Tocar Ya y 1° Puesto */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {onPlayNow && (
                          <button
                            onClick={() => {
                              sounds.playNeedleDrop();
                              onPlayNow(song);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3 py-2 text-xs font-black text-black active:scale-95 transition shadow"
                            title="Reproducir ahora mismo en la TV"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Tocar ya</span>
                          </button>
                        )}

                        {idx > 0 && (
                          <button
                            onClick={() => {
                              sounds.playButtonTick();
                              onMoveToTop(song.id);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-3 py-2 text-xs font-black text-black active:scale-95 transition shadow"
                            title="Pasar al primer turno de la fila"
                          >
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>1° Puesto</span>
                          </button>
                        )}
                      </div>

                      {/* Derecha: Flechas Subir/Bajar y Borrar */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={idx === 0}
                          onClick={() => {
                            sounds.playButtonTick();
                            onMoveUp?.(song.id);
                          }}
                          className={`h-9 w-9 flex items-center justify-center rounded-xl border transition active:scale-95 ${
                            idx === 0
                              ? 'border-gray-800/60 text-gray-700 cursor-not-allowed'
                              : 'border-gray-700 bg-gray-900 text-cyan-400 hover:bg-gray-800'
                          }`}
                          title="Subir un puesto"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>

                        <button
                          disabled={idx === roomState.queue.length - 1}
                          onClick={() => {
                            sounds.playButtonTick();
                            onMoveDown?.(song.id);
                          }}
                          className={`h-9 w-9 flex items-center justify-center rounded-xl border transition active:scale-95 ${
                            idx === roomState.queue.length - 1
                              ? 'border-gray-800/60 text-gray-700 cursor-not-allowed'
                              : 'border-gray-700 bg-gray-900 text-cyan-400 hover:bg-gray-800'
                          }`}
                          title="Bajar un puesto"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        {onRemoveSong && (
                          <button
                            onClick={() => {
                              sounds.playButtonTick();
                              onRemoveSong(song.id);
                            }}
                            className="h-9 w-9 flex items-center justify-center rounded-xl border border-red-900/50 bg-red-950/40 text-red-400 hover:bg-red-900/60 transition active:scale-95"
                            title="Quitar de la fila"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: BUSCADOR COMPLETO DE YOUTUBE                                      */}
      {/* ========================================================================= */}
      {currentView === 'search' && (
        <main className="mx-auto w-full max-w-2xl flex-1 p-3.5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <button
              onClick={() => {
                sounds.playButtonTick();
                setCurrentView('home');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-gray-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a la Cola</span>
            </button>

            <span className="font-mono text-xs font-bold text-gray-400">
              BUSCADOR YOUTUBE
            </span>
          </div>

          {/* Input de Búsqueda con Botón Limpiar */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe canción o cantante..."
              className="w-full rounded-2xl border-2 border-cyan-500/70 bg-[#12151d] pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none shadow-inner"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center hover:bg-gray-600 transition"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {isSearchingYt && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              </div>
            )}
          </div>

          {/* Pastillas de Búsqueda Rápida (Inspiración en 1 toque) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
              Búsquedas populares para la fiesta:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SEARCH_PILLS.map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => {
                    sounds.playButtonTick();
                    setSearchQuery(pill.query);
                    performSearch(pill.query);
                  }}
                  className="rounded-xl border border-gray-700 bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-gray-300 hover:border-cyan-400 hover:text-cyan-300 active:scale-95 transition"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resultados de Búsqueda */}
          {ytSearchResults.length > 0 ? (
            <div className="space-y-2.5">
              <span className="text-xs font-mono text-cyan-400 block font-bold">
                {ytSearchResults.length} resultados encontrados:
              </span>
              {ytSearchResults.map((video) => (
                <div
                  key={video.videoId}
                  className="rounded-2xl border border-gray-800 bg-[#12151d] p-3 hover:border-cyan-500/60 transition shadow"
                >
                  <div className="flex items-center gap-3">
                    <SongThumbnail
                      src={video.thumbnail}
                      videoId={video.videoId}
                      alt={video.title}
                      className="h-14 w-20 rounded-xl object-cover bg-black shrink-0 border border-gray-700"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight">
                        {video.title}
                      </h4>
                      <p className="text-xs text-cyan-400 font-semibold truncate mt-0.5">
                        {video.artist}
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción directos */}
                  <div className="mt-2.5 pt-2 border-t border-gray-800/80 grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleAddYouTubeResult(video, false)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 py-2 text-[11px] font-bold text-cyan-300 active:scale-95 transition"
                    >
                      <Plus className="h-3 w-3" />
                      <span>A la Fila</span>
                    </button>

                    <button
                      onClick={() => handleAddYouTubeResult(video, true)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-amber-400 hover:bg-amber-300 py-2 text-[11px] font-black text-black active:scale-95 transition shadow"
                    >
                      <Star className="h-3 w-3 fill-current" />
                      <span>1° Puesto</span>
                    </button>

                    {onPlayNow && (
                      <button
                        onClick={() => {
                          sounds.playNeedleDrop();
                          onPlayNow({
                            id: `yt_${video.videoId}_${Date.now()}`,
                            videoId: video.videoId,
                            title: video.title,
                            artist: video.artist,
                            thumbnail: video.thumbnail,
                            votes: 1,
                            voters: [],
                            addedAt: Date.now(),
                          });
                          setNotification(`▶️ Reproduciendo "${video.title}" en la TV`);
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="flex items-center justify-center gap-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-2 text-[11px] font-black text-black active:scale-95 transition shadow"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Tocar Ya</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim().length >= 2 && !isSearchingYt ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-sm font-semibold">No encontramos videos para esa búsqueda</p>
              <p className="text-xs mt-1">Prueba con el nombre del artista o cantante</p>
            </div>
          ) : null}
        </main>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: EXPLORAR GÉNEROS MUSICALES                                        */}
      {/* ========================================================================= */}
      {currentView === 'genres' && (
        <main className="mx-auto w-full max-w-2xl flex-1 p-3.5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <button
              onClick={() => {
                sounds.playButtonTick();
                setCurrentView('home');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-gray-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a la Cola</span>
            </button>

            <span className="font-mono text-xs font-bold text-gray-400">
              GÉNEROS MUSICALES
            </span>
          </div>

          <div className="text-center py-1">
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              Selecciona un Género
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Toca un recuadro para abrir los discos y temas de ese estilo.
            </p>
          </div>

          {/* Cuadrícula de Géneros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GENRE_CATEGORIES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => {
                  sounds.playButtonTick();
                  setActiveGenre(genre);
                  setCurrentView('disco_wall');
                }}
                className={`relative overflow-hidden rounded-2xl border-2 p-3.5 text-left transition-all duration-200 shadow-lg hover:scale-[1.01] active:scale-95 bg-gradient-to-br ${genre.gradient} border-gray-700 hover:border-cyan-400`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-3xl">{genre.icon}</span>
                  <span className="text-[10px] font-black uppercase text-cyan-300 border border-cyan-500/40 bg-black/60 px-2 py-0.5 rounded">
                    Abrir ➔
                  </span>
                </div>

                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  {genre.name}
                </h3>
                <p className="text-[11px] text-gray-300 mt-0.5 line-clamp-1">
                  {genre.subtitle}
                </p>
              </button>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: DISCOS DEL GÉNERO SELECCIONADO (GABINETE VIRTUAL)                 */}
      {/* ========================================================================= */}
      {currentView === 'disco_wall' && (
        <main className="mx-auto w-full max-w-2xl flex-1 p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <button
              onClick={() => {
                sounds.playButtonTick();
                setCurrentView('genres');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-gray-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Géneros</span>
            </button>

            <div className="flex items-center gap-1.5 truncate">
              <span className="text-lg">{activeGenre.icon}</span>
              <span className="font-mono text-xs font-black uppercase text-white truncate">
                {activeGenre.name} ({filteredArtists.length})
              </span>
            </div>

            <button
              onClick={() => {
                sounds.playButtonTick();
                setCurrentView('home');
              }}
              className="rounded-xl border border-cyan-500/50 bg-cyan-950 px-2.5 py-1.5 text-xs font-black text-cyan-300 hover:text-white transition"
            >
              Cola ({roomState.queue.length})
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
              className="flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-3 py-1.5 text-xs font-black shadow transition shrink-0"
            >
              {isAddingCustomArtist ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Crear</span>
            </button>
          </form>

          {/* Discos del Género */}
          <div className="space-y-3">
            {filteredArtists.map((artist) => (
              <div
                key={artist.id}
                className="flex border-2 border-[#374151] bg-black rounded-2xl overflow-hidden shadow-lg hover:border-cyan-500/70 transition-all"
              >
                {/* Foto del Artista */}
                <div className="w-[36%] shrink-0 relative bg-[#0a0a0a] flex items-center justify-center border-r-2 border-[#374151] overflow-hidden">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Columna Derecha con Nombre y Lista de Canciones */}
                <div className="w-[64%] flex flex-col bg-black">
                  <div className="bg-white text-black px-2 py-1 text-center font-black tracking-wider text-xs font-sans uppercase border-b-2 border-black truncate">
                    {artist.name}
                  </div>

                  <div className="flex-1 p-1.5 flex flex-col justify-between text-xs">
                    {artist.songs.map((song) => (
                      <button
                        key={song.code + song.title}
                        onClick={() => handleSelectTrack(song)}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg text-left hover:bg-cyan-950/80 active:bg-cyan-800 transition group border border-transparent hover:border-cyan-500/40"
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
        </main>
      )}

      {/* ========================================================================= */}
      {/* MINI-REPRODUCTOR FLOTANTE INFERIOR (SIEMPRE AL ALCANCE DEL PULGAR)        */}
      {/* ========================================================================= */}
      {roomState.currentSong && (
        <div className="fixed bottom-16 inset-x-2 max-w-2xl mx-auto z-40">
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-cyan-500/70 bg-[#121620]/95 backdrop-blur-xl p-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)]">
            {/* Información clickeable para volver a la cola */}
            <button
              onClick={() => {
                sounds.playButtonTick();
                setCurrentView('home');
              }}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left group"
            >
              <div className="relative shrink-0">
                <SongThumbnail
                  src={roomState.currentSong.thumbnail}
                  videoId={roomState.currentSong.videoId}
                  alt={roomState.currentSong.title}
                  className="h-11 w-11 rounded-xl object-cover bg-black border border-cyan-500/40 shadow"
                />
                {roomState.isPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-mono font-black uppercase text-emerald-400 tracking-wider block">
                  {roomState.isPlaying ? 'SONANDO EN LA TV' : 'EN PAUSA EN LA TV'}
                </span>
                <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition">
                  {roomState.currentSong.title}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {roomState.currentSong.artist}
                </p>
              </div>
            </button>

            {/* Controles rápidos de reproducción */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  sounds.playButtonTick();
                  onPlayPauseToggle(!roomState.isPlaying);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black shadow active:scale-95 transition"
                title={roomState.isPlaying ? 'Pausar TV' : 'Reproducir TV'}
              >
                {roomState.isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  sounds.playButtonTick();
                  onNextSong();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 active:scale-95 transition"
                title="Siguiente canción"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA DE NAVEGACIÓN INFERIOR FIJA (THUMB-FRIENDLY & ERGONÓMICA)           */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#0e1117]/95 backdrop-blur-xl border-t border-gray-800 px-3 py-1.5 shadow-[0_-5px_25px_rgba(0,0,0,0.6)]">
        <div className="mx-auto flex max-w-md items-center justify-around gap-1">
          {/* Tab 1: Cola */}
          <button
            onClick={() => {
              sounds.playButtonTick();
              setCurrentView('home');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
              currentView === 'home'
                ? 'text-cyan-400 font-bold scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <ListMusic className="h-5 w-5" />
              {roomState.queue.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-black text-black font-mono">
                  {roomState.queue.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-sans">Cola</span>
          </button>

          {/* Tab 2: Buscar */}
          <button
            onClick={() => {
              sounds.playButtonTick();
              setCurrentView('search');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
              currentView === 'search'
                ? 'text-cyan-400 font-bold scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-sans">Buscar</span>
          </button>

          {/* Tab 3: Discos & Géneros */}
          <button
            onClick={() => {
              sounds.playButtonTick();
              setCurrentView('genres');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
              currentView === 'genres' || currentView === 'disco_wall'
                ? 'text-cyan-400 font-bold scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Compass className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-sans">Discos</span>
          </button>

          {/* Tab 4: Ver Pantalla TV */}
          {onBackToTV && (
            <button
              onClick={() => {
                sounds.playButtonTick();
                onBackToTV();
              }}
              className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-gray-400 hover:text-cyan-300 transition"
            >
              <Tv className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-sans">Ver TV</span>
            </button>
          )}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MODAL DIÁLOGO DE ACCIÓN AL TOCAR CUALQUIER CANCIÓN                        */}
      {/* ========================================================================= */}
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
