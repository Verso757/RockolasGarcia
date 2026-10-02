import { useEffect } from 'react';

interface UseTvRemoteOptions {
  onPlayPause: () => void;
  onNext: () => void;
  onToggleFullscreen?: () => void;
  onOpenSearch?: () => void;
}

/**
 * Handles physical TV remote control buttons (D-Pad, Media Keys, Enter, Back)
 * Compatible with Samsung Tizen, LG webOS, Android TV / Google TV, Fire TV, Roku browsers.
 */
export function useTvRemote({
  onPlayPause,
  onNext,
  onToggleFullscreen,
  onOpenSearch,
}: UseTvRemoteOptions) {
  useEffect(() => {
    // 1. Samsung Tizen API: Register media keys if available
    try {
      const tizen = (window as unknown as { tizen?: { tvinputdevice?: { registerKey: (k: string) => void } } })?.tizen;
      if (tizen?.tvinputdevice?.registerKey) {
        const keysToRegister = [
          'MediaPlay',
          'MediaPause',
          'MediaPlayPause',
          'MediaTrackNext',
          'MediaTrackPrevious',
          'MediaFastForward',
          'MediaRewind',
          'MediaStop',
          'ChannelUp',
          'ChannelDown',
        ];
        keysToRegister.forEach((k) => {
          try {
            tizen.tvinputdevice?.registerKey(k);
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // ignore
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when user is typing inside an input field
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape' || e.keyCode === 10009 || e.keyCode === 27) {
          target.blur();
        }
        return;
      }

      const keyCode = e.keyCode || e.which;
      const key = e.key;

      // 1. PLAY / PAUSE (Samsung Tizen: 10252, 415, 19 | LG webOS: 415, 19 | Standard: MediaPlayPause, Space)
      if (
        key === 'MediaPlayPause' ||
        key === 'MediaPlay' ||
        key === 'MediaPause' ||
        key === ' ' ||
        key === 'k' ||
        key === 'K' ||
        keyCode === 10252 || // Samsung OneRemote Play/Pause toggle
        keyCode === 415 ||   // Samsung / LG Play
        keyCode === 19       // Samsung / LG Pause
      ) {
        e.preventDefault();
        e.stopPropagation();
        onPlayPause();
        return;
      }

      // 2. NEXT SONG (Samsung Tizen: 417 FastFwd, 427 ChannelUp | Standard: MediaTrackNext, n)
      if (
        key === 'MediaTrackNext' ||
        key === 'MediaFastForward' ||
        key === 'n' ||
        key === 'N' ||
        keyCode === 417 || // Samsung FastForward
        keyCode === 427    // Channel Up button on TV Remote
      ) {
        e.preventDefault();
        e.stopPropagation();
        onNext();
        return;
      }

      // 3. FULLSCREEN (f / F / Blue button / keyCode 406 on TV remotes)
      if (
        key === 'f' ||
        key === 'F' ||
        keyCode === 406 || // Samsung Blue button
        keyCode === 405    // Samsung Yellow button
      ) {
        if (onToggleFullscreen) {
          e.preventDefault();
          e.stopPropagation();
          onToggleFullscreen();
          return;
        }
      }

      // 4. SEARCH / CATALOG (s / S / / / Red button / keyCode 403 on TV remotes)
      if (
        key === 's' ||
        key === 'S' ||
        key === '/' ||
        keyCode === 403 // Samsung Red button
      ) {
        if (onOpenSearch) {
          e.preventDefault();
          e.stopPropagation();
          onOpenSearch();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onPlayPause, onNext, onToggleFullscreen, onOpenSearch]);
}
