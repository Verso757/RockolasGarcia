import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { SongItem, PlayedSongRecord, RockolaTheme } from '../types';
import { ListMusic, Trash2, Play, Search, Smartphone } from 'lucide-react';
import { sounds } from '../utils/audioEffects';
import { SongThumbnail } from './SongThumbnail';

interface JukeboxTvQueuePanelProps {
  queue: SongItem[];
  history: PlayedSongRecord[];
  currentSong: SongItem | null;
  currentTheme?: RockolaTheme;
  onRemove: (songId: string) => void;
  onMoveToTop: (songId: string) => void;
  onPlayNow?: (song: SongItem) => void;
  onOpenSearch: () => void;
  onClearQueue: () => void;
}

export const JukeboxTvQueuePanel: React.FC<JukeboxTvQueuePanelProps> = ({
  queue,
  onRemove,
  onPlayNow,
  onOpenSearch,
  onClearQueue,
}) => {
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && qrRef.current) {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'guest');
      QRCode.toCanvas(
        qrRef.current,
        url.toString(),
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#0a0d12',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('Error rendering QR:', err);
        }
      );
    }
  }, []);

  const getJukeboxCode = (idx: number) => {
    return String(idx + 1).padStart(3, '0');
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* TARJETA QR DE ESCANEO GIGANTE PARA LA TV */}
      <div className="rounded-2xl border-2 border-gray-500 bg-gradient-to-b from-[#2a2f3a] via-[#1c2027] to-[#12151b] p-3.5 shadow-2xl flex items-center gap-3.5">
        <div className="rounded-xl bg-white p-1 shadow-lg shrink-0 border-2 border-cyan-400">
          <canvas ref={qrRef} className="block h-24 w-24 sm:h-28 sm:w-28" />
        </div>

        <div className="flex flex-col justify-center min-w-0 flex-1">
          <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
            <Smartphone className="h-3.5 w-3.5 text-cyan-300" />
            CONTROL DIGITAL
          </span>
          <h4 className="font-sans text-xs sm:text-sm font-black text-white uppercase mt-0.5 leading-tight">
            Pide canciones con tu celular
          </h4>
          <p className="text-[11px] text-gray-300 mt-1 leading-snug">
            Apunta la cámara de tu teléfono para abrir el menú de discos y canciones en tu mesa.
          </p>
        </div>
      </div>

      {/* TARJETERO DIGITAL DE LA COLA */}
      <div className="flex-1 flex flex-col rounded-2xl border-2 border-gray-600 bg-gradient-to-b from-[#181a20] via-[#0f1115] to-[#07080a] p-3 shadow-2xl min-h-[380px]">
        {/* Cabecera estilo placa metálica */}
        <div className="flex items-center justify-between border-b-2 border-gray-700 pb-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
            <h3 className="font-mono text-xs font-black uppercase text-cyan-300 truncate tracking-wider">
              LISTA EN ESPERA ({queue.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="text-[10px] text-gray-400 hover:text-rose-400 transition"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1 rounded bg-cyan-500 hover:bg-cyan-400 px-2.5 py-1 text-[11px] font-black text-black shadow transition active:scale-95"
            >
              <Search className="h-3 w-3" />
              <span>Pedir</span>
            </button>
          </div>
        </div>

        {/* Tiras Digitales de Título */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-2 text-center">
              <span className="text-3xl mb-2">💿</span>
              <p className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
                SIN MÚSICA EN ESPERA
              </p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-[220px]">
                Escanea el código QR desde tu celular o pulsa «Pedir» para buscar en YouTube.
              </p>
            </div>
          ) : (
            queue.map((song, idx) => {
              const code = getJukeboxCode(idx);
              const isNext = idx === 0;

              return (
                <div
                  key={song.id}
                  className={`group relative flex items-center justify-between gap-2.5 rounded-lg border p-2 shadow transition-all duration-200 ${
                    isNext
                      ? 'border-cyan-400 bg-gradient-to-r from-[#172533] to-[#0d141b]'
                      : 'border-gray-800 bg-[#0d0f13] hover:border-gray-600'
                  }`}
                >
                  {/* Luz indicadora y Código 001 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isNext
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                          : 'bg-gray-600'
                      }`}
                      title={isNext ? 'Próxima a sonar' : 'En cola'}
                    />
                    <span className="font-mono text-[11px] font-black text-black bg-cyan-400 px-1.5 py-0.5 rounded shadow-inner">
                      {code}
                    </span>
                  </div>

                  {/* Portada miniatura */}
                  <SongThumbnail
                    src={song.thumbnail}
                    videoId={song.videoId}
                    alt={song.title}
                    className="h-9 w-12 rounded object-cover bg-black shrink-0 border border-gray-700"
                  />

                  {/* Título & Artista */}
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-xs font-bold text-gray-100 font-sans">
                      {song.title}
                    </h5>
                    <p className="truncate text-[10px] text-gray-400">
                      {song.artist || 'Artista'}
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onPlayNow && (
                      <button
                        onClick={() => {
                          sounds.playNeedleDrop();
                          onPlayNow(song);
                        }}
                        className="rounded p-1 text-cyan-400 hover:bg-cyan-950 transition"
                        title="Tocar ahora"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(song.id)}
                      className="rounded p-1 text-gray-500 hover:text-rose-400 transition"
                      title="Quitar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
