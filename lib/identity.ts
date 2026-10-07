import { randomIdentity, uid, type Member } from "@/lib/room";

/*
 * Identity lives in sessionStorage so every tab is a different "teammate" —
 * exactly what we want when testing with BroadcastChannel across tabs.
 * The last chosen name is mirrored to localStorage as a default for new tabs
 * only when the user set it explicitly.
 */

const ME_KEY = "lunchbox:me";
const NAME_PREF_KEY = "lunchbox:name-pref";
const hostKey = (roomId: string) => `lunchbox:host:${roomId}`;

interface StoredMe {
  id: string;
  name: string;
  avatar: string;
}

function safeGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function loadMe(roomId: string): Member {
  let stored: StoredMe | null = null;
  const raw = safeGet(sessionStorage, ME_KEY);
  if (raw) {
    try {
      stored = JSON.parse(raw) as StoredMe;
    } catch {
      stored = null;
    }
  }
  if (!stored?.id) {
    const pref = safeGet(localStorage, NAME_PREF_KEY);
    const fresh = randomIdentity();
    let base = fresh;
    if (pref) {
      try {
        base = { ...fresh, ...(JSON.parse(pref) as Partial<StoredMe>) };
      } catch {
        /* keep random */
      }
    }
    stored = { id: uid("m_"), name: base.name, avatar: base.avatar };
    safeSet(sessionStorage, ME_KEY, JSON.stringify(stored));
  }
  return { ...stored, isHost: safeGet(sessionStorage, hostKey(roomId)) === "1", lastSeen: Date.now() };
}

export function saveProfile(patch: { name: string; avatar: string }) {
  const raw = safeGet(sessionStorage, ME_KEY);
  const current = raw ? (JSON.parse(raw) as StoredMe) : { id: uid("m_"), ...patch };
  safeSet(sessionStorage, ME_KEY, JSON.stringify({ ...current, ...patch }));
  safeSet(localStorage, NAME_PREF_KEY, JSON.stringify(patch));
}

export function claimHost(roomId: string) {
  safeSet(sessionStorage, hostKey(roomId), "1");
}
