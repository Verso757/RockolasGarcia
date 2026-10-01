import React from 'react';
import { Search, Cast, Monitor, Smartphone } from 'lucide-react';
import { sounds } from '../utils/audioEffects';
import { RockolaTheme } from '../types';

interface RockolaHeaderProps {
  name: string;
  currentMode: 'tv' | 'guest';
  currentTheme: RockolaTheme;
  onChangeMode: (mode: 'tv' | 'guest') => void;
  onOpenSearch: () => void;
  onOpenCast: () => void;
  onOpenTheme: () => void;
  queueCount: number;
}

export const RockolaHeader: React.FC<RockolaHeaderProps> = ({
  name,
  currentMode,
  onChangeMode,
  onOpenSearch,
  onOpenCast,
  queueCount,
}) => {
  return (
    <header className="relative z-20 border-b-2 border-[#4b5563] bg-gradient-to-r from-[#1f242d] via-[#2a303c] to-[#1f242d] px-4 py-2.5 shadow-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Placa metálica Virtual Music Jukebox */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border-2 border-gray-400 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 px-4 py-1.5 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2)]">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <h1 className="text-sm md:text-base font-black tracking-widest uppercase text-white font-mono">
              VIRTUAL MUSIC JUKEBOX
            </h1>
            <span className="text-[11px] font-bold text-cyan-300 font-sans hidden sm:inline">
              • {name}
            </span>
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          </div>
        </div>

        {/* Acciones de la rockola */}
        <div className="flex items-center gap-2">
          {/* Botón Buscar Canción */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/70 bg-[#16202c] px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-950 transition shadow-sm active:scale-95"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buscar en YouTube</span>
            <span className="sm:hidden">Buscar</span>
          </button>

          {/* Botón Transmitir a la TV */}
          <button
            onClick={onOpenCast}
            className="flex items-center gap-1.5 rounded-lg border border-gray-600 bg-[#232731] px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-[#323745] transition shadow-sm"
            title="Conectar a TV"
          >
            <Cast className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Conectar</span>
          </button>

          {/* Selector TV / Celular */}
          <div className="flex items-center rounded-lg border border-gray-600 bg-[#111317] p-0.5 shadow-inner">
            <button
              onClick={() => {
                sounds.playButtonTick();
                onChangeMode('tv');
              }}
              className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-black transition ${
                currentMode === 'tv'
                  ? 'bg-cyan-500 text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>PANTALLA TV</span>
            </button>

            <button
              onClick={() => {
                sounds.playButtonTick();
                onChangeMode('guest');
              }}
              className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-black transition ${
                currentMode === 'guest'
                  ? 'bg-cyan-500 text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>CELULAR</span>
              {queueCount > 0 && (
                <span className="ml-1 rounded-full bg-black text-cyan-400 px-1.5 py-0.2 text-[10px] border border-cyan-600 font-mono">
                  {queueCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
