import React, { useState, useEffect, useRef } from 'react';
import { SongItem } from '../types';
import { ChevronRight, ChevronLeft, Pause, Play, Sparkles, X, Lightbulb } from 'lucide-react';

interface VideoTriviaOverlayProps {
  currentSong: SongItem | null;
  isPlaying: boolean;
}

interface FactItem {
  id: string;
  category: string;
  icon: string;
  badge: string;
  text: string;
}

const DEFAULT_FACTS: FactItem[] = [
  {
    id: 'f1',
    category: 'MÚSICA EN VIVO',
    icon: '🎵',
    badge: 'Rockola',
    text: 'Reproducción continua y sincronizada en tiempo real para todos los invitados.',
  },
  {
    id: 'f2',
    category: 'SISTEMA DE AUDIO',
    icon: '📻',
    badge: 'Hi-Fi',
    text: 'Escanea el código QR en pantalla con tu celular para buscar y agregar canciones a la lista.',
  },
];

export const VideoTriviaOverlay: React.FC<VideoTriviaOverlayProps> = ({
  currentSong,
  isPlaying,
}) => {
  const [facts, setFacts] = useState<FactItem[]>(DEFAULT_FACTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch trivia when current song changes
  useEffect(() => {
    if (!currentSong) {
      setFacts(DEFAULT_FACTS);
      setCurrentIndex(0);
      return;
    }

    let isMounted = true;
    const fetchTrivia = async () => {
      try {
        const query = new URLSearchParams({
          title: currentSong.title,
          artist: currentSong.artist || '',
          videoId: currentSong.videoId,
        });

        // 1. Try server endpoint first
        let triviaData: any = null;
        try {
          const res = await fetch(`/api/song-trivia?${query.toString()}`);
          if (res.ok) {
            const data = await res.json();
            if (data.trivia && data.trivia.curiosity) {
              triviaData = data.trivia;
            }
          }
        } catch {
          // ignore
        }

        // 2. If server didn't provide specific metadata, query iTunes API directly from client
        if (!triviaData || !triviaData.album) {
          try {
            const cleanSearch = `${currentSong.title} ${currentSong.artist || ''}`.replace(/\(.*?\)|\[.*?\]/g, '').trim();
            const itunesRes = await fetch(
              `https://itunes.apple.com/search?term=${encodeURIComponent(cleanSearch)}&entity=song&limit=1`
            );
            if (itunesRes.ok) {
              const itunesJson = await itunesRes.json();
              if (itunesJson.results && itunesJson.results.length > 0) {
                const track = itunesJson.results[0];
                triviaData = {
                  year: track.releaseDate ? track.releaseDate.substring(0, 4) : (triviaData?.year || ''),
                  album: track.collectionName || (triviaData?.album || ''),
                  genre: track.primaryGenreName || (triviaData?.genre || ''),
                  curiosity: triviaData?.curiosity || `Tema de ${track.artistName || currentSong.artist || 'este artista'}.`,
                };
              }
            }
          } catch {
            // ignore
          }
        }

        if (isMounted) {
          const newFacts: FactItem[] = [];

          // 1. Dato Curioso principal (strictly about the song)
          if (triviaData?.curiosity && !triviaData.curiosity.includes('Vicente') && !triviaData.curiosity.includes('Rafael')) {
            newFacts.push({
              id: 'curiosity',
              category: 'DATO CURIOSO',
              icon: '💡',
              badge: triviaData.year || 'Canción',
              text: triviaData.curiosity,
            });
          }

          // 2. Álbum y Lanzamiento
          if (triviaData?.album || triviaData?.year) {
            const details: string[] = [];
            if (triviaData.album) details.push(`Álbum: "${triviaData.album}"`);
            if (triviaData.year) details.push(`Año: ${triviaData.year}`);
            if (triviaData.genre) details.push(`Género: ${triviaData.genre}`);

            newFacts.push({
              id: 'history',
              category: 'INFORMACIÓN DEL TEMA',
              icon: '📅',
              badge: triviaData.year || 'Lanzamiento',
              text: details.join(' • '),
            });
          }

          // 3. Artista / Intérprete
          if (currentSong.artist) {
            newFacts.push({
              id: 'artist',
              category: 'ARTISTA',
              icon: '🎤',
              badge: currentSong.artist,
              text: `Interpretada por ${currentSong.artist}.`,
            });
          }

          // Fallback fact if nothing was returned
          if (newFacts.length === 0) {
            newFacts.push({
              id: 'song-now',
              category: 'REPRODUCIENDO',
              icon: '🎵',
              badge: 'En vivo',
              text: `"${currentSong.title}" ${currentSong.artist ? `de ${currentSong.artist}` : ''}.`,
            });
          }

          setFacts(newFacts);
          setCurrentIndex(0);
          setProgress(0);
        }
      } catch {
        if (isMounted) {
          setFacts([
            {
              id: 'song-now',
              category: 'REPRODUCIENDO',
              icon: '🎵',
              badge: 'En vivo',
              text: `"${currentSong.title}" ${currentSong.artist ? `de ${currentSong.artist}` : ''}.`,
            },
          ]);
        }
      }
    };

    fetchTrivia();

    return () => {
      isMounted = false;
    };
  }, [currentSong?.videoId, currentSong?.title, currentSong?.artist]);

  // Automated running ticker: changes every 9 seconds
  const DURATION_MS = 9000;
  const STEP_MS = 100;

  useEffect(() => {
    if (isPaused || facts.length <= 1 || isMinimized) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (STEP_MS / DURATION_MS) * 100;
        if (next >= 100) {
          setCurrentIndex((idx) => (idx + 1) % facts.length);
          return 0;
        }
        return next;
      });
    }, STEP_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, facts.length, currentIndex, isMinimized]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProgress(0);
    setCurrentIndex((idx) => (idx + 1) % facts.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProgress(0);
    setCurrentIndex((idx) => (idx - 1 + facts.length) % facts.length);
  };

  const handleTogglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  const currentFact = facts[currentIndex] || facts[0];

  // Si está minimizado, muestra un botón sutil y translúcido en la esquina
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="absolute bottom-20 left-4 z-30 flex items-center gap-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-cyan-500/50 px-3 py-1.5 text-xs font-bold text-cyan-300 shadow-xl transition"
        title="Mostrar datos curiosos"
      >
        <Lightbulb className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        <span>Dato curioso ({currentIndex + 1}/{facts.length})</span>
      </button>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="absolute bottom-20 right-4 sm:right-6 max-w-sm sm:max-w-md z-30 overflow-hidden rounded-2xl bg-black/80 hover:bg-black/95 backdrop-blur-md border-2 border-cyan-500/50 p-3.5 text-white shadow-[0_10px_40px_rgba(0,0,0,0.85)] transition-all duration-300 animate-in fade-in slide-in-from-right-4"
    >
      {/* Cabecera del Dato Curioso */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse shrink-0" />
          <span className="font-mono text-xs font-black uppercase tracking-wider text-cyan-300 truncate">
            {currentFact.icon} {currentFact.category}
          </span>
          <span className="hidden xs:inline-block rounded bg-gray-900 border border-cyan-500/30 px-1.5 py-0.5 text-[9px] font-mono text-cyan-200">
            {currentFact.badge}
          </span>
        </div>

        {/* Controles de avance, pausa y cerrar */}
        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          <span className="text-[10px] font-mono mr-1 text-cyan-400 font-bold">
            {currentIndex + 1}/{facts.length}
          </span>
          <button
            onClick={handlePrev}
            className="rounded p-1 hover:bg-gray-800 hover:text-white transition"
            title="Dato anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleTogglePause}
            className="rounded p-1 hover:bg-gray-800 hover:text-white transition"
            title={isPaused ? 'Reanudar' : 'Pausar'}
          >
            {isPaused ? <Play className="h-3 w-3 text-cyan-400" /> : <Pause className="h-3 w-3" />}
          </button>
          <button
            onClick={handleNext}
            className="rounded p-1 hover:bg-gray-800 hover:text-white transition"
            title="Siguiente dato"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="rounded p-1 ml-1 text-gray-400 hover:text-red-400 transition"
            title="Ocultar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Texto del Dato Curioso */}
      <p className="text-xs sm:text-[13px] text-gray-100 font-sans leading-relaxed select-text font-medium">
        {currentFact.text}
      </p>

      {/* Barra de progreso inferior en cian */}
      <div className="mt-2.5 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
