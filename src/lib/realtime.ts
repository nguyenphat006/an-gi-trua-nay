import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { BroadcastMessage, RoomState, RealtimeActionType } from '@/types';

// Optional Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export class RealtimeRoomClient {
  private roomId: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private listeners: ((message: BroadcastMessage) => void)[] = [];

  constructor(roomId: string) {
    this.roomId = roomId;

    // 1. Initialize native browser BroadcastChannel for zero-config multi-tab testing
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(`lunchbox-room-${roomId}`);
        this.broadcastChannel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
          if (event.data && event.data.roomId === this.roomId) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err) {
        console.warn('Native BroadcastChannel not available', err);
      }
    }

    // 2. Initialize Supabase Realtime channel if configured
    if (supabase) {
      try {
        this.supabaseChannel = supabase.channel(`room-${roomId}`, {
          config: {
            broadcast: { self: false },
          },
        });

        this.supabaseChannel
          .on('broadcast', { event: 'lunchbox-event' }, ({ payload }) => {
            const message = payload as BroadcastMessage;
            if (message && message.roomId === this.roomId) {
              this.notifyListeners(message);
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription error', err);
      }
    }
  }

  public subscribe(callback: (message: BroadcastMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(message: BroadcastMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (e) {
        console.error('Error in listener callback', e);
      }
    });
  }

  public broadcast<T>(type: RealtimeActionType, senderId: string, payload: T): void {
    const message: BroadcastMessage<T> = {
      type,
      roomId: this.roomId,
      senderId,
      payload,
      timestamp: Date.now(),
    };

    // 1. Send via native BroadcastChannel (for other tabs in this browser)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (err) {
        console.warn('BroadcastChannel postMessage error', err);
      }
    }

    // 2. Send via Supabase Realtime if connected
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'lunchbox-event',
          payload: message,
        });
      } catch (err) {
        console.warn('Supabase broadcast send error', err);
      }
    }
  }

  public cleanup(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.supabaseChannel && supabase) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }
    this.listeners = [];
  }
}

/**
 * LocalStorage state caching helper so rooms survive refresh
 */
export function getStoredRoomState(roomId: string): RoomState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`lunchbox_room_${roomId}`);
    if (!raw) return null;
    return JSON.parse(raw) as RoomState;
  } catch {
    return null;
  }
}

export function saveStoredRoomState(roomId: string, state: RoomState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`lunchbox_room_${roomId}`, JSON.stringify(state));
  } catch {}
}
