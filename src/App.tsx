/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { RockolaRoomState, SongItem, RockolaTheme } from './types';
import { RockolaHeader } from './components/RockolaHeader';
import { YouTubeJukeboxPlayer } from './components/YouTubeJukeboxPlayer';
import { QueueList } from './components/QueueList';
import { JukeboxTvQueuePanel } from './components/JukeboxTvQueuePanel';
import { GuestRequestView } from './components/GuestRequestView';
import { SearchModal } from './components/SearchModal';
import { CastModal } from './components/CastModal';
import { ThemeModal } from './components/ThemeModal';
import { useTvRemote } from './hooks/useTvRemote';
import { sounds } from './utils/audioEffects';
import { getPublicRockolaUrl } from './utils/publicUrl';
import { THEMES } from './utils/themeStyles';
import { peerSync } from './services/peerSync';

const DEFAULT_STATE: RockolaRoomState = {
  name: 'Rockola Rafael García',
  currentSong: null,
  isPlaying: false,
  queue: [],
  history: [],
  autoPlayDj: true,
  theme: 'wurlitzer',
};

export default function App() {
  const [roomState, setRoomState] = useState<RockolaRoomState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rockola_room_state_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.queue)) {
            return {
              ...DEFAULT_STATE,
              ...parsed,
            };
          }
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_STATE;
  });
  const [mode, setMode] = useState<'tv' | 'guest'>('tv');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCastModal, setShowCastModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [tvUrl, setTvUrl] = useState<string>('');

  // Persist state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rockola_room_state_v1', JSON.stringify(roomState));
      } catch {
        // ignore
      }
    }
  }, [roomState]);

  // Detect mode & retrieve/generate deviceId
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isMobileScreen = window.innerWidth <= 768;

      // Open directly in mobile/guest mode if launched as PWA or on phone
      if (params.get('mode') === 'guest' || isStandalone || (isMobileScreen && params.get('mode') !== 'tv')) {
        setMode('guest');
      } else if (params.get('mode') === 'tv') {
        setMode('tv');
      }

      setTvUrl(getPublicRockolaUrl('tv'));

      let did = localStorage.getItem('rockola_device_id');
      if (!did) {
        did = 'dev_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('rockola_device_id', did);
      }
      setDeviceId(did);
    }
  }, []);

  // Fetch initial state & connect SSE stream + active sync polling
  useEffect(() => {
    let isMounted = true;

    const fetchState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok && isMounted) {
          const data = await res.json();
          setRoomState((prev) => {
            // Only update if something changed to avoid unnecessary re-renders
            if (
              prev.currentSong?.videoId === data.currentSong?.videoId &&
              prev.isPlaying === data.isPlaying &&
              prev.queue.length === data.queue.length &&
              prev.theme === data.theme
            ) {
              return prev;
            }
            // If server state is completely blank but locally we have a queue, preserve local queue
            if (data.queue?.length === 0 && !data.currentSong && (prev.queue.length > 0 || prev.currentSong)) {
              return prev;
            }
            return {
              ...prev,
              ...data,
            };
          });
        }
      } catch (err) {
        // Backend not reachable yet
      }
    };

    fetchState();

    // Active polling interval every 2.5s guarantees synchronization across mobile & PC
    const pollInterval = setInterval(fetchState, 2500);

    let eventSource: EventSource | null = null;
    const connectSSE = () => {
      try {
        const deviceType = mode === 'guest' ? 'mobile' : 'tv';
        const deviceName = mode === 'guest' ? 'Celular' : 'Smart TV (Principal)';
        eventSource = new EventSource(`/api/stream?deviceType=${deviceType}&deviceName=${encodeURIComponent(deviceName)}`);

        eventSource.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setRoomState((prev) => ({
              ...prev,
              ...data,
            }));
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect after 3s
          setTimeout(() => {
            if (isMounted) connectSSE();
          }, 3000);
        };
      } catch {
        // ignore
      }
    };

    connectSSE();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
    };
  }, [mode]);

  // Handle adding a song
  const handleAddSong = useCallback(
    async (songData: Partial<SongItem> & { isPriority?: boolean }) => {
      // 1. Direct WebRTC P2P transmission from Phone to TV
      if (mode === 'guest') {
        const sentPeer = peerSync.sendSongToHost(songData);
        if (sentPeer) {
          console.log('✅ Canción enviada directamente a la TV vía WebRTC P2P');
        }
      }

      // 2. HTTP sync attempt (PHP on Hostinger or Node backend)
      try {
        const cleanId = songData.videoId || 'unknown';
        const res = await fetch('/api/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...songData,
            videoId: cleanId,
            title: songData.title || 'Canción',
            deviceId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setRoomState((prev) => ({
            ...prev,
            queue: data.queue,
            currentSong: data.currentSong || prev.currentSong,
            isPlaying: data.currentSong ? true : prev.isPlaying,
          }));
          return;
        }
      } catch (err) {
        console.warn('API sync fallback to WebRTC / Local:', err);
      }

      // 3. Local / Host state update
      const cleanId = songData.videoId || 'unknown';
      const newSong: SongItem = {
        id: 'song_' + Date.now(),
        videoId: cleanId,
        title: songData.title || 'Canción',
        artist: songData.artist || '',
        thumbnail: songData.thumbnail || `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`,
        votes: songData.isPriority ? 10 : 1,
        voters: [deviceId],
        addedAt: Date.now(),
        isFirstPriority: songData.isPriority,
      };
      setRoomState((prev) => {
        if (!prev.currentSong) {
          return { ...prev, currentSong: newSong, isPlaying: true };
        }
        return {
          ...prev,
          queue: songData.isPriority ? [newSong, ...prev.queue] : [...prev.queue, newSong],
        };
      });
    },
    [deviceId, mode]
  );

  // Play next song
  const handleNextSong = useCallback(async () => {
    sounds.playNeedleDrop();
    if (mode === 'guest') {
      peerSync.sendCommandToHost('NEXT');
    }
    try {
      const res = await fetch('/api/player/next', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setRoomState((prev) => ({
          ...prev,
          currentSong: data.currentSong,
          queue: data.queue,
          isPlaying: !!data.currentSong,
        }));
      }
    } catch {
      setRoomState((prev) => {
        const current = prev.currentSong;
        const newHistory = current
          ? [{ ...current, playedAt: Date.now(), playCount: 1 }, ...prev.history].slice(0, 25)
          : prev.history;
        if (prev.queue.length > 0) {
          const [next, ...rest] = prev.queue;
          return {
            ...prev,
            currentSong: next,
            queue: rest,
            history: newHistory,
            isPlaying: true,
          };
        }
        return {
          ...prev,
          currentSong: null,
          history: newHistory,
          isPlaying: false,
        };
      });
    }
  }, [mode]);

  // Play / Pause toggle
  const handlePlayPauseToggle = useCallback((playing: boolean) => {
    setRoomState((prev) => ({ ...prev, isPlaying: playing }));
    if (mode === 'guest') {
      peerSync.sendCommandToHost('PLAY_PAUSE', playing);
    }
    fetch('/api/player/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPlaying: playing }),
    }).catch(() => {});
  }, [mode]);

  // Jump to song immediately
  const handlePlayNow = useCallback((song: SongItem) => {
    sounds.playNeedleDrop();
    if (mode === 'guest') {
      peerSync.sendCommandToHost('PLAY_NOW', song);
    }
    setRoomState((prev) => {
      const newQueue = prev.queue.filter((s) => s.id !== song.id);
      const newHistory = prev.currentSong
        ? [{ ...prev.currentSong, playedAt: Date.now(), playCount: 1 }, ...prev.history].slice(0, 25)
        : prev.history;
      return {
        ...prev,
        currentSong: song,
        queue: newQueue,
        history: newHistory,
        isPlaying: true,
      };
    });

    fetch('/api/player/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentSong: song, isPlaying: true }),
    }).catch(() => {});
  }, [mode]);

  // WebRTC P2P Room Synchronization Setup
  useEffect(() => {
    if (mode === 'tv') {
      peerSync.initHost(
        (song) => {
          console.log('🎵 [TV Host] Canción recibida de celular vía WebRTC:', song.title);
          handleAddSong(song);
        },
        (deviceCount) => {
          console.log('📱 Celulares en línea:', deviceCount);
        },
        (command) => {
          if (command.action === 'PLAY_PAUSE') {
            handlePlayPauseToggle(typeof command.payload === 'boolean' ? command.payload : !roomState.isPlaying);
          } else if (command.action === 'NEXT') {
            handleNextSong();
          } else if (command.action === 'PLAY_NOW' && command.payload) {
            handlePlayNow(command.payload);
          }
        }
      );
    } else {
      peerSync.initGuest((remoteState) => {
        setRoomState((prev) => ({
          ...prev,
          ...remoteState,
        }));
      });
    }

    return () => {
      peerSync.cleanup();
    };
  }, [mode, handleAddSong, handlePlayPauseToggle, handleNextSong, handlePlayNow, roomState.isPlaying]);

  // Broadcast TV state to all connected guest phones
  useEffect(() => {
    if (mode === 'tv') {
      peerSync.broadcastToGuests(roomState);
    }
  }, [roomState, mode]);

  // Move song to top (Pasar al primer puesto)
  const handleMoveToTop = useCallback(async (songId: string) => {
    sounds.playButtonTick();
    try {
      const res = await fetch(`/api/queue/${songId}/top`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.queue) {
          setRoomState((prev) => ({ ...prev, queue: data.queue }));
        }
      }
    } catch {
      setRoomState((prev) => {
        const idx = prev.queue.findIndex((s) => s.id === songId);
        if (idx > -1) {
          const q = [...prev.queue];
          const [song] = q.splice(idx, 1);
          song.isFirstPriority = true;
          q.unshift(song);
          return { ...prev, queue: q };
        }
        return prev;
      });
    }
  }, []);

  // Move song up
  const handleMoveUp = useCallback(async (songId: string) => {
    try {
      const res = await fetch(`/api/queue/${songId}/up`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.queue) {
          setRoomState((prev) => ({ ...prev, queue: data.queue }));
        }
      }
    } catch {
      setRoomState((prev) => {
        const idx = prev.queue.findIndex((s) => s.id === songId);
        if (idx > 0) {
          const q = [...prev.queue];
          const temp = q[idx];
          q[idx] = q[idx - 1];
          q[idx - 1] = temp;
          return { ...prev, queue: q };
        }
        return prev;
      });
    }
  }, []);

  // Move song down
  const handleMoveDown = useCallback(async (songId: string) => {
    try {
      const res = await fetch(`/api/queue/${songId}/down`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.queue) {
          setRoomState((prev) => ({ ...prev, queue: data.queue }));
        }
      }
    } catch {
      setRoomState((prev) => {
        const idx = prev.queue.findIndex((s) => s.id === songId);
        if (idx > -1 && idx < prev.queue.length - 1) {
          const q = [...prev.queue];
          const temp = q[idx];
          q[idx] = q[idx + 1];
          q[idx + 1] = temp;
          return { ...prev, queue: q };
        }
        return prev;
      });
    }
  }, []);

  // Remove song
  const handleRemoveSong = useCallback(async (songId: string) => {
    try {
      const res = await fetch(`/api/queue/${songId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.queue) {
          setRoomState((prev) => ({ ...prev, queue: data.queue }));
        }
      }
    } catch {
      setRoomState((prev) => ({
        ...prev,
        queue: prev.queue.filter((s) => s.id !== songId),
      }));
    }
  }, []);

  // Clear queue
  const handleClearQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/queue/clear', {
        method: 'POST',
      });
      if (res.ok) {
        setRoomState((prev) => ({ ...prev, queue: [] }));
      }
    } catch {
      setRoomState((prev) => ({ ...prev, queue: [] }));
    }
  }, []);

  // PHYSICAL TV REMOTE CONTROL HOOK
  useTvRemote({
    onPlayPause: () => handlePlayPauseToggle(!roomState.isPlaying),
    onNext: handleNextSong,
    onOpenSearch: () => setShowSearchModal(true),
  });

  // Toggle AutoPlay DJ
  const handleToggleAutoPlayDj = useCallback(async () => {
    const nextVal = !roomState.autoPlayDj;
    try {
      await fetch('/api/settings/autoplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPlayDj: nextVal }),
      });
      setRoomState((prev) => ({ ...prev, autoPlayDj: nextVal }));
    } catch {
      setRoomState((prev) => ({ ...prev, autoPlayDj: nextVal }));
    }
  }, [roomState.autoPlayDj]);

  // Change theme in real-time
  const handleSelectTheme = useCallback(async (theme: RockolaTheme) => {
    try {
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      setRoomState((prev) => ({ ...prev, theme }));
    } catch {
      setRoomState((prev) => ({ ...prev, theme }));
    }
  }, []);

  const activeTheme = THEMES[roomState.theme] || THEMES.wurlitzer;

  return (
    <div className="min-h-screen bg-[#0b0d11] text-white font-sans selection:bg-cyan-500 selection:text-black">
      {/* Modo Control Móvil */}
      {mode === 'guest' ? (
        <GuestRequestView
          roomState={roomState}
          onAddSong={handleAddSong}
          onMoveToTop={handleMoveToTop}
          onPlayPauseToggle={handlePlayPauseToggle}
          onNextSong={handleNextSong}
          onSelectTheme={handleSelectTheme}
          onOpenCast={() => setShowCastModal(true)}
          onBackToTV={() => setMode('tv')}
        />
      ) : (
        /* Pantalla de TV: 100% Pantalla Completa Cinematográfica con QR Discreto y Efectos */
        <div className="w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
          <YouTubeJukeboxPlayer
            currentSong={roomState.currentSong}
            isPlaying={roomState.isPlaying}
            currentTheme={roomState.theme}
            onPlayPauseToggle={handlePlayPauseToggle}
            onNextSong={handleNextSong}
            onSongEnd={handleNextSong}
            onOpenSearch={() => setShowSearchModal(true)}
            onOpenCast={() => setShowCastModal(true)}
            onChangeMode={setMode}
            isHost={true}
          />
        </div>
      )}

      {/* Modal de Búsqueda Clásico */}
      {showSearchModal && (
        <SearchModal
          history={roomState.history}
          onClose={() => setShowSearchModal(false)}
          onAddSong={handleAddSong}
        />
      )}

      {/* Modal de Transmisión a TV */}
      {showCastModal && (
        <CastModal
          onClose={() => setShowCastModal(false)}
          tvUrl={tvUrl}
        />
      )}

      {/* Modal de Cambio de Tema */}
      {showThemeModal && (
        <ThemeModal
          currentTheme={roomState.theme}
          onClose={() => setShowThemeModal(false)}
          onSelectTheme={handleSelectTheme}
        />
      )}
    </div>
  );
}
