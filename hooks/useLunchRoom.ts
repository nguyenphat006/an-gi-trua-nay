"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { loadMe, saveProfile } from "@/lib/identity";
import {
  colorForDish,
  DRAW_DURATION_MS,
  emojiForDish,
  emptyRoom,
  MAX_DISHES,
  MAX_NOTE,
  normalizeDishName,
  randomIndex,
  sameDish,
  uid,
  type Dish,
  type Member,
  type OrderNote,
  type RoomState,
} from "@/lib/room";
import { createRoomTransport, type Envelope, type RoomEvent, type RoomSnapshot, type RoomTransport, type TransportKind } from "@/lib/realtime";
import { sfx } from "@/lib/sound";

const HEARTBEAT_MS = 4000;
const MEMBER_TTL_MS = 12000;
/** Extra time after the draw for the capsule drop / pop sequence. */
const REVEAL_TAIL_MS = 3500;

/* ------------------------------------------------------------------ */
/* Reducer — local and remote events go through the same code path.   */
/* ------------------------------------------------------------------ */

type Action =
  | { kind: "event"; from: string; event: RoomEvent; now: number }
  | { kind: "host"; hostId: string }
  | { kind: "finishDraw"; drawId: string };

function addDish(state: RoomState, dish: Dish): RoomState {
  if (state.tombstones.includes(dish.id)) return state;
  if (state.dishes.some((d) => d.id === dish.id || sameDish(d.name, dish.name))) return state;
  if (state.dishes.length >= MAX_DISHES) return state;
  return { ...state, dishes: [...state.dishes, dish] };
}

function mergeSnapshot(state: RoomState, snap: RoomSnapshot, from: string, now: number): RoomState {
  const tombstones = Array.from(new Set([...state.tombstones, ...snap.tombstones]));
  const alive = <T extends { id: string }>(xs: T[]) => xs.filter((x) => !tombstones.includes(x.id));
  const authoritative = snap.hostId === from;

  let next: RoomState = {
    ...state,
    hostId: state.hostId ?? snap.hostId,
    allowAnyoneDraw: authoritative ? snap.allowAnyoneDraw : state.allowAnyoneDraw,
    tombstones,
    dishes: alive(state.dishes),
    notes: alive(state.notes),
  };
  for (const d of alive(snap.dishes)) next = addDish(next, d);
  const noteIds = new Set(next.notes.map((n) => n.id));
  next.notes = [...next.notes, ...alive(snap.notes).filter((n) => !noteIds.has(n.id))];

  // Adopt a draw we haven't seen yet. Late joiners skip straight to the result.
  const d = snap.draw;
  if (d.status !== "idle" && d.winner && d.drawId !== state.draw.drawId) {
    const elapsed = d.elapsedMs ?? Infinity;
    next.draw =
      d.status === "drawing" && elapsed < DRAW_DURATION_MS + REVEAL_TAIL_MS
        ? { status: "drawing", drawId: d.drawId, winner: d.winner, startedAt: now - elapsed }
        : { status: "done", drawId: d.drawId, winner: d.winner };
  }
  return next;
}

function reducer(state: RoomState, action: Action): RoomState {
  switch (action.kind) {
    case "host":
      return state.hostId === action.hostId ? state : { ...state, hostId: action.hostId };

    case "finishDraw":
      return state.draw.drawId === action.drawId && state.draw.status === "drawing"
        ? { ...state, draw: { ...state.draw, status: "done" } }
        : state;

    case "event": {
      const { event, from, now } = action;
      switch (event.type) {
        case "dish:add":
          return state.draw.status === "drawing" ? state : addDish(state, event.dish);
        case "dish:remove":
          return {
            ...state,
            dishes: state.dishes.filter((d) => d.id !== event.dishId),
            tombstones: [...state.tombstones, event.dishId],
          };
        case "note:add": {
          const rest = state.notes.filter((n) => n.id !== event.note.id);
          return { ...state, notes: [...rest, event.note] };
        }
        case "note:remove":
          return {
            ...state,
            notes: state.notes.filter((n) => n.id !== event.noteId),
            tombstones: [...state.tombstones, event.noteId],
          };
        case "settings":
          return { ...state, allowAnyoneDraw: event.allowAnyoneDraw };
        case "draw:start":
          if (state.draw.drawId === event.drawId) return state;
          return { ...state, draw: { status: "drawing", drawId: event.drawId, winner: event.winner, startedAt: now } };
        case "draw:reset": {
          const removed = state.notes.map((n) => n.id);
          let dishes = event.keepDishes ? state.dishes : [];
          if (event.removeDishId) dishes = dishes.filter((d) => d.id !== event.removeDishId);
          const goneDishes = state.dishes.filter((d) => !dishes.includes(d)).map((d) => d.id);
          return {
            ...state,
            dishes,
            notes: [],
            draw: { status: "idle" },
            tombstones: [...state.tombstones, ...removed, ...goneDishes],
          };
        }
        case "sync":
          return mergeSnapshot(state, event.snapshot, from, now);
        default:
          return state;
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export interface LunchRoom {
  ready: boolean;
  transportKind: TransportKind | null;
  me: Member | null;
  state: RoomState;
  members: Member[];
  isHost: boolean;
  hostOnline: boolean;
  canDraw: boolean;
  addDish(name: string): string | null;
  removeDish(id: string): void;
  addNote(text: string): void;
  removeNote(id: string): void;
  setAllowAnyoneDraw(value: boolean): void;
  startDraw(): void;
  finishDraw(drawId: string): void;
  resetDraw(opts: { keepDishes: boolean; removeWinner?: boolean }): void;
  updateProfile(patch: { name: string; avatar: string }): void;
}

export function useLunchRoom(roomId: string): LunchRoom {
  const [state, dispatch] = useReducer(reducer, roomId, emptyRoom);
  const [me, setMe] = useState<Member | null>(null);
  const [peers, setPeers] = useState<Record<string, Member>>({});
  const [transportKind, setTransportKind] = useState<TransportKind | null>(null);

  const transportRef = useRef<RoomTransport | null>(null);
  const stateRef = useRef(state);
  const meRef = useRef(me);
  const peersRef = useRef(peers);
  stateRef.current = state;
  meRef.current = me;
  peersRef.current = peers;

  const send = useCallback((event: RoomEvent) => {
    const self = meRef.current;
    if (!self || !transportRef.current) return;
    transportRef.current.send({ from: self.id, sentAt: Date.now(), event });
  }, []);

  /** Apply locally *and* broadcast — keeps every peer on the same reducer. */
  const emit = useCallback(
    (event: RoomEvent) => {
      const self = meRef.current;
      if (!self) return;
      dispatch({ kind: "event", from: self.id, event, now: Date.now() });
      send(event);
    },
    [send],
  );

  const snapshot = useCallback((): RoomSnapshot => {
    const s = stateRef.current;
    return {
      hostId: s.hostId,
      allowAnyoneDraw: s.allowAnyoneDraw,
      dishes: s.dishes,
      notes: s.notes,
      tombstones: s.tombstones,
      draw: {
        status: s.draw.status,
        drawId: s.draw.drawId,
        winner: s.draw.winner,
        elapsedMs: s.draw.startedAt ? Date.now() - s.draw.startedAt : undefined,
      },
    };
  }, []);

  // Connect: identity → transport → hello → heartbeats.
  useEffect(() => {
    let cancelled = false;
    let heartbeat: number | undefined;
    let pruner: number | undefined;
    let unsubscribe: (() => void) | undefined;

    const self = loadMe(roomId);
    meRef.current = self;
    setMe(self);
    if (self.isHost) dispatch({ kind: "host", hostId: self.id });

    const touchPeer = (m: Member) => {
      if (m.id === meRef.current?.id) return;
      const isNew = !peersRef.current[m.id];
      setPeers((prev) => ({ ...prev, [m.id]: { ...m, lastSeen: Date.now() } }));
      if (m.isHost) dispatch({ kind: "host", hostId: m.id });
      return isNew;
    };

    const onEnvelope = ({ from, event }: Envelope) => {
      const current = meRef.current;
      if (!current || from === current.id) return;
      const now = Date.now();

      switch (event.type) {
        case "hello": {
          if (touchPeer(event.member)) sfx.join();
          send({ type: "heartbeat", member: { ...current, lastSeen: now } });
          // Host answers with the room snapshot; if the host is away, any peer does.
          const s = stateRef.current;
          const hostAway = !s.hostId || (s.hostId !== current.id && !peersRef.current[s.hostId]);
          if (current.isHost || hostAway) send({ type: "sync", to: event.member.id, snapshot: snapshot() });
          return;
        }
        case "heartbeat":
          touchPeer(event.member);
          return;
        case "leave":
          setPeers((prev) => {
            const { [event.memberId]: _gone, ...rest } = prev;
            return rest;
          });
          return;
        case "sync":
          if (event.to !== current.id) return;
          dispatch({ kind: "event", from, event, now });
          return;
        default:
          dispatch({ kind: "event", from, event, now });
      }
    };

    void createRoomTransport(roomId).then((transport) => {
      if (cancelled) {
        transport.close();
        return;
      }
      transportRef.current = transport;
      setTransportKind(transport.kind);
      unsubscribe = transport.subscribe(onEnvelope);
      send({ type: "hello", member: self });

      heartbeat = window.setInterval(() => {
        const m = meRef.current;
        if (m) send({ type: "heartbeat", member: { ...m, lastSeen: Date.now() } });
      }, HEARTBEAT_MS);

      pruner = window.setInterval(() => {
        const cutoff = Date.now() - MEMBER_TTL_MS;
        setPeers((prev) => {
          const stale = Object.values(prev).filter((p) => p.lastSeen < cutoff);
          if (stale.length === 0) return prev;
          const next = { ...prev };
          stale.forEach((p) => delete next[p.id]);
          return next;
        });
      }, 3000);
    });

    const onLeave = () => send({ type: "leave", memberId: self.id });
    window.addEventListener("pagehide", onLeave);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onLeave);
      onLeave();
      window.clearInterval(heartbeat);
      window.clearInterval(pruner);
      unsubscribe?.();
      transportRef.current?.close();
      transportRef.current = null;
    };
  }, [roomId, send, snapshot]);

  /* ---------------------------- derived ---------------------------- */

  const members = useMemo(() => {
    const list = Object.values(peers);
    if (me) list.unshift(me);
    return list.sort((a, b) => Number(b.isHost) - Number(a.isHost));
  }, [me, peers]);

  const isHost = !!me && (me.isHost || state.hostId === me.id);
  const hostOnline = isHost || (!!state.hostId && !!peers[state.hostId]);
  const canDraw = isHost || state.allowAnyoneDraw || !hostOnline;

  /* ---------------------------- actions ---------------------------- */

  const addDishAction = useCallback(
    (raw: string): string | null => {
      const self = meRef.current;
      const s = stateRef.current;
      const name = normalizeDishName(raw);
      if (!self) return "Đang kết nối…";
      if (!name) return "Nhập tên món đã nha!";
      if (s.draw.status === "drawing") return "Máy đang quay, đợi xíu!";
      if (s.dishes.some((d) => sameDish(d.name, name))) return `"${name}" có trong lồng rồi nè`;
      if (s.dishes.length >= MAX_DISHES) return `Lồng đầy rồi (tối đa ${MAX_DISHES} món)`;
      emit({
        type: "dish:add",
        dish: {
          id: uid("d_"),
          name,
          emoji: emojiForDish(name),
          color: colorForDish(name),
          addedById: self.id,
          addedByName: self.name,
          createdAt: Date.now(),
        },
      });
      return null;
    },
    [emit],
  );

  const removeDish = useCallback((id: string) => emit({ type: "dish:remove", dishId: id }), [emit]);

  const addNote = useCallback(
    (text: string) => {
      const self = meRef.current;
      const clean = text.trim().slice(0, MAX_NOTE);
      if (!self || !clean) return;
      const note: OrderNote = {
        id: uid("n_"),
        memberId: self.id,
        name: self.name,
        avatar: self.avatar,
        text: clean,
        createdAt: Date.now(),
      };
      emit({ type: "note:add", note });
    },
    [emit],
  );

  const removeNote = useCallback((id: string) => emit({ type: "note:remove", noteId: id }), [emit]);

  const setAllowAnyoneDraw = useCallback(
    (value: boolean) => emit({ type: "settings", allowAnyoneDraw: value }),
    [emit],
  );

  const startDraw = useCallback(() => {
    const s = stateRef.current;
    if (s.draw.status === "drawing" || s.dishes.length < 2) return;
    // The drawer decides the winner and broadcasts it, so every screen shows the same result.
    const winner = s.dishes[randomIndex(s.dishes.length)];
    emit({ type: "draw:start", drawId: uid("draw_"), winner });
  }, [emit]);

  const finishDraw = useCallback((drawId: string) => dispatch({ kind: "finishDraw", drawId }), []);

  const resetDraw = useCallback(
    ({ keepDishes, removeWinner }: { keepDishes: boolean; removeWinner?: boolean }) => {
      emit({
        type: "draw:reset",
        keepDishes,
        removeDishId: removeWinner ? stateRef.current.draw.winner?.id : undefined,
      });
    },
    [emit],
  );

  const updateProfile = useCallback(
    (patch: { name: string; avatar: string }) => {
      const name = patch.name.trim().slice(0, 28);
      if (!name || !meRef.current) return;
      const next = { ...meRef.current, name, avatar: patch.avatar, lastSeen: Date.now() };
      saveProfile({ name, avatar: patch.avatar });
      meRef.current = next;
      setMe(next);
      send({ type: "heartbeat", member: next });
    },
    [send],
  );

  return {
    ready: !!me && !!transportKind,
    transportKind,
    me,
    state,
    members,
    isHost,
    hostOnline,
    canDraw,
    addDish: addDishAction,
    removeDish,
    addNote,
    removeNote,
    setAllowAnyoneDraw,
    startDraw,
    finishDraw,
    resetDraw,
    updateProfile,
  };
}
