import type { Dish, DrawState, Member, OrderNote } from "@/lib/room";

/** Snapshot a peer sends so newcomers can catch up (there is no database). */
export interface RoomSnapshot {
  hostId?: string;
  allowAnyoneDraw: boolean;
  dishes: Dish[];
  notes: OrderNote[];
  tombstones: string[];
  draw: Omit<DrawState, "startedAt"> & { elapsedMs?: number };
}

export type RoomEvent =
  | { type: "hello"; member: Member }
  | { type: "heartbeat"; member: Member }
  | { type: "leave"; memberId: string }
  | { type: "sync"; to: string; snapshot: RoomSnapshot }
  | { type: "dish:add"; dish: Dish }
  | { type: "dish:remove"; dishId: string }
  | { type: "note:add"; note: OrderNote }
  | { type: "note:remove"; noteId: string }
  | { type: "settings"; allowAnyoneDraw: boolean }
  | { type: "draw:start"; drawId: string; winner: Dish }
  | { type: "draw:reset"; keepDishes: boolean; removeDishId?: string };

export interface Envelope {
  from: string;
  sentAt: number;
  event: RoomEvent;
}

export type TransportKind = "broadcast-channel" | "supabase";

export interface RoomTransport {
  readonly kind: TransportKind;
  send(envelope: Envelope): void;
  subscribe(handler: (envelope: Envelope) => void): () => void;
  close(): void;
}
