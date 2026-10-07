import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { Envelope, RoomTransport } from "./types";

let client: SupabaseClient | null = null;

function getClient(url: string, key: string) {
  client ??= createClient(url, key, { realtime: { params: { eventsPerSecond: 20 } } });
  return client;
}

/** Cross-device transport over a Supabase Realtime Broadcast channel. */
export function createSupabaseTransport(roomId: string, url: string, key: string): RoomTransport {
  const supabase = getClient(url, key);
  const handlers = new Set<(e: Envelope) => void>();
  const queue: Envelope[] = [];
  let ready = false;

  const channel: RealtimeChannel = supabase.channel(`room-${roomId}`, {
    config: { broadcast: { self: false, ack: false } },
  });

  channel
    .on("broadcast", { event: "room" }, ({ payload }) => {
      handlers.forEach((h) => h(payload as Envelope));
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ready = true;
        // Flush anything sent before the socket was ready (e.g. the initial "hello").
        queue.splice(0).forEach((e) => void channel.send({ type: "broadcast", event: "room", payload: e }));
      }
    });

  return {
    kind: "supabase",
    send(envelope) {
      if (!ready) {
        queue.push(envelope);
        return;
      }
      void channel.send({ type: "broadcast", event: "room", payload: envelope });
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close() {
      handlers.clear();
      void supabase.removeChannel(channel);
    },
  };
}
