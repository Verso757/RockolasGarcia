/**
 * WebRTC P2P Real-Time Synchronization Service using PeerJS
 * Connects Mobile Phones directly to the TV/PC Screen across the internet
 * without relying on a central database or Node.js server.
 */

import Peer, { type DataConnection } from 'peerjs';
import type { SongItem, RockolaRoomState } from '../types';

export const PRIMARY_ROOM_ID = 'rockola-garcia-fam-tv';

class PeerSyncService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private isHost: boolean = false;
  private onSongAddedCallback?: (song: Partial<SongItem> & { isPriority?: boolean }) => void;
  private onStateUpdatedCallback?: (state: Partial<RockolaRoomState>) => void;
  private onDeviceCountCallback?: (count: number) => void;

  // Initialize as TV (Host)
  public initHost(
    onSongAdded: (song: Partial<SongItem> & { isPriority?: boolean }) => void,
    onDeviceCount?: (count: number) => void
  ) {
    this.isHost = true;
    this.onSongAddedCallback = onSongAdded;
    this.onDeviceCountCallback = onDeviceCount;

    this.cleanup();

    try {
      this.peer = new Peer(PRIMARY_ROOM_ID, {
        debug: 0,
      });

      this.peer.on('open', (id) => {
        this.onDeviceCountCallback?.(this.connections.size);
      });

      this.peer.on('connection', (conn) => {
        this.connections.set(conn.peer, conn);
        this.onDeviceCountCallback?.(this.connections.size);

        conn.on('data', (data: any) => {
          if (data && data.type === 'ADD_SONG' && data.song) {
            this.onSongAddedCallback?.(data.song);
          }
        });

        conn.on('close', () => {
          this.connections.delete(conn.peer);
          this.onDeviceCountCallback?.(this.connections.size);
        });

        conn.on('error', () => {
          this.connections.delete(conn.peer);
          this.onDeviceCountCallback?.(this.connections.size);
        });
      });

      this.peer.on('disconnected', () => {
        if (this.peer && !this.peer.destroyed) {
          try {
            this.peer.reconnect();
          } catch {
            // ignore
          }
        }
      });

      this.peer.on('error', (err: any) => {
        if (!err) return;
        if (err.type === 'unavailable-id') {
          return;
        }
        if (err.type === 'peer-unavailable') {
          return;
        }
        if (err.type === 'server-error' || err.type === 'network' || err.message?.includes('Lost connection')) {
          if (this.peer && !this.peer.destroyed && this.peer.disconnected) {
            try {
              this.peer.reconnect();
            } catch {
              // ignore
            }
          }
        }
      });
    } catch {
      // ignore
    }
  }

  // Initialize as Guest (Mobile Phone)
  public initGuest(onStateUpdated?: (state: Partial<RockolaRoomState>) => void) {
    this.isHost = false;
    this.onStateUpdatedCallback = onStateUpdated;

    this.cleanup();

    try {
      this.peer = new Peer({ debug: 0 });

      this.peer.on('open', () => {
        this.connectToHost();
      });

      this.peer.on('disconnected', () => {
        if (this.peer && !this.peer.destroyed) {
          try {
            this.peer.reconnect();
          } catch {
            // ignore
          }
        }
      });

      this.peer.on('error', (err: any) => {
        if (!err) return;
        if (err.type === 'peer-unavailable') {
          setTimeout(() => this.connectToHost(), 3500);
          return;
        }
        if (err.type === 'server-error' || err.type === 'network' || err.message?.includes('Lost connection')) {
          if (this.peer && !this.peer.destroyed && this.peer.disconnected) {
            try {
              this.peer.reconnect();
            } catch {
              // ignore
            }
          }
        }
      });
    } catch {
      // ignore
    }
  }

  private connectToHost() {
    if (!this.peer || this.peer.destroyed) return;

    try {
      const conn = this.peer.connect(PRIMARY_ROOM_ID, {
        reliable: true,
      });

      conn.on('open', () => {
        console.log('✅ [WebRTC] Conectado exitosamente con la pantalla de la TV!');
        this.hostConnection = conn;
      });

      conn.on('data', (data: any) => {
        if (data && data.type === 'SYNC_STATE' && data.state) {
          this.onStateUpdatedCallback?.(data.state);
        }
      });

      conn.on('close', () => {
        this.hostConnection = null;
        // Reintentar en 3 segundos
        setTimeout(() => this.connectToHost(), 3000);
      });

      conn.on('error', () => {
        this.hostConnection = null;
      });
    } catch (err) {
      console.warn('Connect to host error:', err);
    }
  }

  // Send a song from Mobile Phone to TV
  public sendSongToHost(song: Partial<SongItem> & { isPriority?: boolean }): boolean {
    if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send({
          type: 'ADD_SONG',
          song,
        });
        console.log('🚀 [WebRTC] Canción enviada directamente a la TV:', song.title);
        return true;
      } catch (err) {
        console.warn('Error sending song over WebRTC:', err);
      }
    }
    return false;
  }

  // Broadcast state from TV to all connected phones
  public broadcastToGuests(state: Partial<RockolaRoomState>) {
    if (!this.isHost) return;

    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send({
            type: 'SYNC_STATE',
            state,
          });
        } catch {
          // ignore
        }
      }
    });
  }

  public isConnectedToHost(): boolean {
    return !!(this.hostConnection && this.hostConnection.open);
  }

  public cleanup() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const peerSync = new PeerSyncService();
