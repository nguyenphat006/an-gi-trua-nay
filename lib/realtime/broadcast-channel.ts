import type { Envelope, RoomTransport } from "./types";

/**
 * Same-browser transport built on the native BroadcastChannel API.
 * Open the room in several tabs/windows to simulate teammates — zero backend.
 */
export function createBroadcastChannelTransport(roomId: string): RoomTransport {
  const channel = new BroadcastChannel(`lunchbox-room-${roomId}`);
  const handlers = new Set<(e: Envelope) => void>();

  channel.onmessage = (msg: MessageEvent<Envelope>) => {
    if (!msg.data || typeof msg.data !== "object" || !("event" in msg.data)) return;
    handlers.forEach((h) => h(msg.data));
  };

  return {
    kind: "broadcast-channel",
    send(envelope) {
      channel.postMessage(envelope);
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close() {
      handlers.clear();
      channel.close();
    },
  };
}
