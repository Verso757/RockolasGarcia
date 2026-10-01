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

const GENERAL_FACTS: FactItem[] = [
  {
    id: 'f1',
    category: 'ROCKOLAS GARCÍA',
    icon: '👑',
    badge: 'Tradición',
    text: 'En la rockola de Rafael García, la regla de oro es cantar con el alma y brindar en familia con cada canción pedida.',
  },
  {
    id: 'f2',
    category: 'ÉPOCA DE ORO',
    icon: '🎺',
    badge: 'Historia',
    text: 'Vicente Fernández popularizó la mítica frase: "Mientras ustedes no dejen de aplaudir, su Chente no deja de cantar".',
  },
  {
    id: 'f3',
    category: 'EL DIVO DE JUÁREZ',
    icon: '⭐',
    badge: 'Anécdota',
    text: 'Juan Gabriel compuso más de 1,800 temas y llenó el Palacio de Bellas Artes rompiendo todos los récords de la música popular.',
  },
  {
    id: 'f4',
    category: 'MÚSICA INMORTAL',
    icon: '📻',
    badge: 'Rockolas',
    text: 'Las primeras rockolas digitales de cantina nacieron para que el público fuera el dueño absoluto del ambiente y la música.',
  },
];

export const VideoTriviaOverlay: React.FC<VideoTriviaOverlayProps> = ({
  currentSong,
  isPlaying,
}) => {
  const [facts, setFacts] = useState<FactItem[]>(GENERAL_FACTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch trivia when current song changes
  useEffect(() => {
    if (!currentSong) {
      setFacts(GENERAL_FACTS);
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
        const res = await fetch(`/api/song-trivia?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.trivia) {
            const t = data.trivia;
            const newFacts: FactItem[] = [];

            // 1. Dato Curioso principal
            if (t.curiosity) {
              newFacts.push({
                id: 'curiosity',
                category: 'DATO CURIOSO',
                icon: '💡',
                badge: t.year || 'Clásico',
                text: t.curiosity,
              });
            }

            // 2. Historia y Álbum
            if (t.year || t.album) {
              newFacts.push({
                id: 'history',
                category: 'LANZAMIENTO',
                icon: '📅',
                badge: t.year || 'Éxito',
                text: `${t.album ? `Tema del álbum "${t.album}". ` : ''}${t.anecdote || 'Una de las piezas más aclamadas de la música hispana.'}`,
              });
            }

            // 3. Estilo y Género
            if (t.genre) {
              newFacts.push({
                id: 'style',
                category: 'GÉNERO & ESTILO',
                icon: '🎵',
                badge: t.genre,
                text: `Sonido emblemático que llena las cantinas y fiestas mexicanas, convirtiéndose en un himno indiscutible.`,
              });
            }

            // 4. Dato del Artista y Familia García
            newFacts.push({
              id: 'artist',
              category: 'EN ROCKOLAS GARCÍA',
              icon: '👑',
              badge: currentSong.artist || 'Música',
              text: `Interpretada magistralmente por ${currentSong.artist || 'grandes leyendas'}. Una de las consentidas de Don Rafa García para cantar a coro.`,
            });

            if (newFacts.length > 0) {
              setFacts(newFacts);
              setCurrentIndex(0);
              setProgress(0);
            }
          }
        }
      } catch {
        // keep defaults
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
