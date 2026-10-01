import React, { useEffect, useRef, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { SongItem, RockolaTheme } from '../types';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Smartphone,
  Search,
  Disc3,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../utils/audioEffects';
import { VideoTriviaOverlay } from './VideoTriviaOverlay';
import { getPublicRockolaUrl } from '../utils/publicUrl';

interface YouTubeJukeboxPlayerProps {
  currentSong: SongItem | null;
  isPlaying: boolean;
  currentTheme?: RockolaTheme;
  onPlayPauseToggle: (playing: boolean) => void;
  onNextSong: () => void;
  onSongEnd: () => void;
  onOpenSearch: () => void;
  onOpenCast?: () => void;
  onChangeMode?: (mode: 'tv' | 'guest') => void;
  isHost?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubeJukeboxPlayer: React.FC<YouTubeJukeboxPlayerProps> = ({
  currentSong,
  isPlaying,
  onPlayPauseToggle,
  onNextSong,
  onSongEnd,
  onOpenSearch,
  onChangeMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(90);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [needUserGesture, setNeedUserGesture] = useState(false);

  // Auto-hide controls timer
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lower-third song banner state (shows for 7 seconds when song changes)
  const [showLowerThird, setShowLowerThird] = useState(true);

  const playerElementId = 'youtube-jukebox-iframe-player';

  // Dynamic atmospheric visual effects based on the song's genre/energy
  const songAtmosphere = useMemo(() => {
    if (!currentSong) {
      return {
        glowColor: 'rgba(6,182,212,0.15)',
        accentColor: '#22d3ee',
        name: 'Rockola Digital',
      };
    }

    const text = `${currentSong.title} ${currentSong.artist} ${(currentSong as any).genre || ''}`.toLowerCase();

    if (text.includes('cumbia') || text.includes('angeles azules') || text.includes('dinamita') || text.includes('selena')) {
      return {
        glowColor: 'rgba(16,185,129,0.3)',
        accentColor: '#10b981',
        name: 'Sabor Tropical & Cumbia',
      };
    }
    if (text.includes('vicente') || text.includes('mariachi') || text.includes('ranchera') || text.includes('infante') || text.includes('nodal')) {
      return {
        glowColor: 'rgba(245,158,11,0.35)',
        accentColor: '#f59e0b',
        name: 'Ranchera & Mariachi',
      };
    }
    if (text.includes('rock') || text.includes('soda') || text.includes('mana') || text.includes('enanitos') || text.includes('juanes')) {
      return {
        glowColor: 'rgba(6,182,212,0.35)',
        accentColor: '#06b6d4',
        name: 'Rock & Pop Latino',
      };
    }
    if (text.includes('balada') || text.includes('jose jose') || text.includes('bukis') || text.includes('raphael') || text.includes('luis miguel')) {
      return {
        glowColor: 'rgba(236,72,153,0.3)',
        accentColor: '#ec4899',
        name: 'Bohemia & Balada Romántica',
      };
    }
    if (text.includes('urbano') || text.includes('reggaeton') || text.includes('don omar') || text.includes('daddy') || text.includes('bunny')) {
      return {
        glowColor: 'rgba(168,85,247,0.35)',
        accentColor: '#a855f7',
        name: 'Urbano & Fiesta',
      };
    }
    return {
      glowColor: 'rgba(245,158,11,0.25)',
      accentColor: '#ffd166',
      name: 'Éxito Clásico',
    };
  }, [currentSong]);

  // Show lower third when song changes
  useEffect(() => {
    if (currentSong) {
      setShowLowerThird(true);
      const t = setTimeout(() => setShowLowerThird(false), 7000);
      return () => clearTimeout(t);
    }
  }, [currentSong?.videoId]);

  // Auto-hide controls when mouse is inactive
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  useEffect(() => {
    const handleMove = () => handleUserActivity();
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchstart', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchstart', handleMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // QR Code directly on top corner
  useEffect(() => {
    if (typeof window !== 'undefined' && qrCanvasRef.current) {
      const guestUrl = getPublicRockolaUrl('guest');
      QRCode.toCanvas(
        qrCanvasRef.current,
        guestUrl,
        {
          width: 96,
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

  // Initialize YouTube Iframe
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player(playerElementId, {
          height: '100%',
          width: '100%',
          videoId: currentSong ? currentSong.videoId : '',
          playerVars: {
            autoplay: isPlayingRef.current ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              setIsReady(true);
              event.target.setVolume(volume);
              if (isPlayingRef.current && currentSong) {
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                onSongEnd();
              } else if (event.data === window.YT.PlayerState.PLAYING) {
                setNeedUserGesture(false);
                if (!isPlayingRef.current) onPlayPauseToggle(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                if (isPlayingRef.current) onPlayPauseToggle(false);
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player error:', err);
              setTimeout(() => onNextSong(), 2000);
            },
          },
        });
      } catch (e) {
        console.error('Player init failed:', e);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Update current song videoId
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    if (currentSong?.videoId) {
      try {
        playerRef.current.loadVideoById({
          videoId: currentSong.videoId,
          startSeconds: 0,
        });
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (err) {
        console.warn('Error loading song:', err);
      }
    } else {
      try {
        playerRef.current.stopVideo();
      } catch {
        // ignore
      }
    }
  }, [currentSong?.videoId, isReady]);

  // Sync play/pause
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      if (isPlaying) {
        const state = playerRef.current.getPlayerState?.();
        if (state !== window.YT.PlayerState.PLAYING) {
          const promise = playerRef.current.playVideo();
          if (promise && promise.catch) {
            promise.catch(() => setNeedUserGesture(true));
          }
        }
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {
      // ignore
    }
  }, [isPlaying, isReady]);

  // Poll progress
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    const interval = setInterval(() => {
      try {
        if (playerRef.current.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
        if (playerRef.current.getDuration) {
          setDuration(playerRef.current.getDuration());
        }
      } catch {
        // ignore
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isReady]);

  const handlePlayPause = () => {
    sounds.playButtonTick();
    onPlayPauseToggle(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(val);
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
      playerRef.current?.unMute?.();
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      playerRef.current?.unMute?.();
      playerRef.current?.setVolume?.(volume);
    } else {
      setIsMuted(true);
      playerRef.current?.mute?.();
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center select-none"
    >
      {/* HALO DE NEÓN REACTIVO AL GÉNERO DE LA CANCIÓN */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 z-10"
        style={{
          boxShadow: isPlaying ? `inset 0 0 120px ${songAtmosphere.glowColor}` : 'none',
        }}
      />

      {/* EL VIDEO DE YOUTUBE OCUPA EL 100% DE LA PANTALLA */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
        <div id={playerElementId} className="w-full h-full pointer-events-auto" />
      </div>

      {/* QR DISCRETO INTEGRADO EN LA ESQUINA SUPERIOR DERECHA */}
      <div className="absolute top-4 right-4 z-30 flex flex-col items-center bg-black/75 backdrop-blur-md rounded-2xl p-2 border border-cyan-500/50 shadow-[0_0_25px_rgba(0,0,0,0.8)] transition duration-300 hover:scale-105">
        <div className="rounded-xl bg-white p-1 shadow">
          <canvas ref={qrCanvasRef} className="block h-20 w-20 sm:h-24 sm:w-24" />
        </div>
        <span className="font-mono text-[10px] sm:text-xs font-black tracking-widest text-cyan-300 uppercase mt-1.5 drop-shadow">
          ROCKOLAS GARCÍA
        </span>
        <span className="text-[9px] text-gray-300 font-sans block">
          📱 Escanea para pedir
        </span>
      </div>

      {/* ATMÓSFERA VISUAL: BADGE SUPERIOR IZQUIERDA DE GÉNERO */}
      {currentSong && isPlaying && (
        <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <span
            className="h-2.5 w-2.5 rounded-full animate-ping"
            style={{ backgroundColor: songAtmosphere.accentColor }}
          />
          <span
            className="text-[11px] font-black uppercase tracking-wider font-mono"
            style={{ color: songAtmosphere.accentColor }}
          >
            {songAtmosphere.name}
          </span>
        </div>
      )}

      {/* LOWER-THIRD DE BROADCAST AL ENTRAR LA CANCIÓN (SE OCULTA A LOS 7s) */}
      {currentSong && showLowerThird && (
        <div className="absolute bottom-20 left-4 sm:left-8 z-30 max-w-lg bg-black/85 backdrop-blur-md border-l-4 rounded-r-2xl p-3.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-500"
          style={{ borderColor: songAtmosphere.accentColor }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-black uppercase text-gray-400 tracking-widest">
              AHORA SUENA EN ROCKOLAS GARCÍA
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-black text-white truncate drop-shadow">
            {currentSong.title}
          </h2>
          <p className="text-xs sm:text-sm font-bold truncate mt-0.5" style={{ color: songAtmosphere.accentColor }}>
            {currentSong.artist}
          </p>
        </div>
      )}

      {/* DATOS CURIOSOS EN PANTALLA (POP-UP BROADCAST STYLE) */}
      {currentSong && isPlaying && (
        <VideoTriviaOverlay
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
      )}

      {/* ESTADO EN BLANCO: CUANDO NO HAY NADA SONANDO */}
      {!currentSong && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
          <div className="relative mb-4">
            <div className="h-24 w-24 rounded-full border-2 border-cyan-500/40 bg-gray-900 flex items-center justify-center shadow-2xl">
              <Disc3 className="h-14 w-14 text-cyan-400 animate-spin [animation-duration:10s]" />
            </div>
          </div>
          <h1 className="font-mono text-2xl sm:text-4xl font-black text-white tracking-[0.2em] uppercase">
            ROCKOLAS GARCÍA
          </h1>
          <p className="mt-2 text-sm text-gray-400 max-w-md">
            Apunta la cámara de tu celular al código QR de la esquina para pedir canciones y poner la fiesta a sonar.
          </p>
          <button
            onClick={onOpenSearch}
            className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-3 text-sm font-black text-black shadow-2xl transition active:scale-95"
          >
            <Search className="h-4 w-4" />
            <span>Buscar canción en YouTube</span>
          </button>
        </div>
      )}

      {/* BOTÓN USER GESTURE (SI EL NAVEGADOR BLOQUEA AUTOPLAY) */}
      {needUserGesture && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <button
            onClick={() => {
              setNeedUserGesture(false);
              playerRef.current?.playVideo();
              onPlayPauseToggle(true);
            }}
            className="flex items-center gap-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 px-8 py-5 text-lg font-black text-black shadow-2xl transition active:scale-95"
          >
            <Play className="h-7 w-7 fill-current" />
            <span>ACTIVAR SONIDO DE LA ROCKOLA</span>
          </button>
        </div>
      )}

      {/* CONTROLES FLOTANTES DISCRETOS (AUTO-HIDE A LOS 3s) */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-300 p-4 bg-gradient-to-t from-black via-black/80 to-transparent ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-5xl flex flex-col gap-2">
          {/* Barra de progreso de la canción */}
          {duration > 0 && (
            <div className="flex items-center gap-3 text-xs font-mono text-gray-300">
              <span className="w-10 text-right">{formatSeconds(currentTime)}</span>
              <div className="relative flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span className="w-10">{formatSeconds(duration)}</span>
            </div>
          )}

          {/* Fila de controles rápidos */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg transition active:scale-95"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={onNextSong}
                className="flex h-11 px-4 items-center justify-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900/90 text-cyan-300 hover:bg-gray-800 transition text-xs font-black active:scale-95"
                title="Siguiente canción"
              >
                <SkipForward className="h-4 w-4" />
                <span>Siguiente</span>
              </button>
            </div>

            {/* Centro: Info actual */}
            {currentSong && (
              <div className="hidden md:flex flex-col text-center min-w-0 max-w-md truncate">
                <span className="text-xs font-black text-white truncate">{currentSong.title}</span>
                <span className="text-[11px] text-cyan-400 truncate">{currentSong.artist}</span>
              </div>
            )}

            {/* Controles de volumen y acceso a celular */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-black/60 border border-gray-800 rounded-lg px-2 py-1">
                <button
                  onClick={handleToggleMute}
                  className="text-gray-300 hover:text-white"
                >
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="h-1.5 w-16 sm:w-24 accent-cyan-400 cursor-pointer"
                />
              </div>

              {onChangeMode && (
                <button
                  onClick={() => onChangeMode('guest')}
                  className="flex items-center gap-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 px-3 py-2 text-xs font-black text-white transition active:scale-95"
                  title="Abrir vista de celular y discos"
                >
                  <Smartphone className="h-4 w-4 text-cyan-400" />
                  <span className="hidden sm:inline">Ver Discos</span>
                </button>
              )}

              <button
                onClick={handleFullscreen}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                title="Pantalla completa"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
