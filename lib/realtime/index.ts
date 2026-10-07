import { createBroadcastChannelTransport } from "./broadcast-channel";
import type { RoomTransport } from "./types";

export * from "./types";

/**
 * Picks the realtime driver. Defaults to BroadcastChannel (multi-tab testing);
 * set NEXT_PUBLIC_REALTIME_DRIVER=supabase plus the Supabase keys for real rooms.
 * The Supabase SDK is loaded lazily so test mode ships none of it.
 */
export async function createRoomTransport(roomId: string): Promise<RoomTransport> {
  const driver = process.env.NEXT_PUBLIC_REALTIME_DRIVER;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (driver === "supabase" && url && key) {
    const { createSupabaseTransport } = await import("./supabase");
    return createSupabaseTransport(roomId, url, key);
  }
  return createBroadcastChannelTransport(roomId);
}
