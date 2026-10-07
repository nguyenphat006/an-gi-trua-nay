"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActionHub } from "@/components/ActionHub";
import { DishComposer } from "@/components/DishComposer";
import { LotteryMachine } from "@/components/LotteryMachine";
import { MemberStrip } from "@/components/MemberStrip";
import { ShareSheet } from "@/components/ShareSheet";
import { SquishyButton } from "@/components/SquishyButton";
import { useLunchRoom } from "@/hooks/useLunchRoom";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/room";
import { isMuted, setMuted, unlockAudio } from "@/lib/sound";

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = normalizeRoomCode(params.id ?? "");

  if (!isValidRoomCode(roomId)) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-6xl">🙈</span>
        <h1 className="text-3xl font-extrabold text-cocoa-900">Mã phòng không hợp lệ</h1>
        <Link href="/" className="font-bold text-mango-600 underline">
          Về trang chủ
        </Link>
      </main>
    );
  }

  return <Room roomId={roomId} />;
}

function Room({ roomId }: { roomId: string }) {
  const room = useLunchRoom(roomId);
  const { state, me, members, isHost, canDraw, hostOnline } = room;
  const [shareOpen, setShareOpen] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [url, setUrl] = useState("");
  const machineRef = useRef<HTMLElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);

  const drawing = state.draw.status === "drawing";
  const done = state.draw.status === "done" && !!state.draw.winner;
  const host = useMemo(() => members.find((m) => m.id === state.hostId), [members, state.hostId]);

  useEffect(() => {
    setMutedState(isMuted());
    setUrl(`${window.location.origin}/room/${roomId}`);
  }, [roomId]);

  // Zoom the stage into view when anyone starts the draw.
  useEffect(() => {
    if (drawing) machineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [drawing]);

  if (!room.ready || !me) return <LoadingScreen roomId={roomId} />;

  const toggleMute = () => {
    unlockAudio();
    setMuted(!muted);
    setMutedState(!muted);
  };

  const openTestTab = () => {
    // noopener → fresh sessionStorage → the new tab is a brand-new teammate.
    window.open(window.location.href, "_blank", "noopener");
  };

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 pb-16">
      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-2 bg-cream/80 px-4 py-3 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-1.5 font-display text-xl font-extrabold text-cocoa-900">
          <motion.span className="text-2xl" whileHover={{ rotate: 20 }}>
            🎰
          </motion.span>
          <span className="hidden sm:inline">
            Lunch<span className="text-mango-500">Box</span>
          </span>
        </Link>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          onClick={() => setShareOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-2xl bg-white px-3 py-1.5 shadow-btn-soft"
        >
          <span className="font-display text-lg font-extrabold tracking-[0.18em] text-mango-600">{roomId}</span>
          <span className="rounded-lg bg-mango-500 px-2 py-0.5 text-xs font-extrabold text-white">Mời 📣</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={toggleMute}
          aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg shadow-btn-soft"
        >
          {muted ? "🔇" : "🔊"}
        </motion.button>
      </header>

      {room.transportKind === "broadcast-channel" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-celery-300 bg-celery-100/60 px-4 py-2.5"
        >
          <p className="text-sm font-bold text-celery-600">
            🧪 Test mode · <code className="rounded bg-white/70 px-1">BroadcastChannel</code> — mở thêm tab để giả lập đồng nghiệp
          </p>
          <SquishyButton size="sm" variant="celery" onClick={openTestTab}>
            + Mở tab mới
          </SquishyButton>
        </motion.div>
      )}

      {/* Dim the room while the machine is the star */}
      <AnimatePresence>
        {drawing && (
          <motion.div
            className="fixed inset-0 z-40 bg-cocoa-900/35 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="lg:col-start-2">
          <MemberStrip members={members} meId={me.id} onEditProfile={room.updateProfile} />
        </div>

        {/* ---------------- Stage ---------------- */}
        <section
          ref={machineRef}
          className={`clay-card relative px-4 pb-6 pt-6 lg:sticky lg:top-20 lg:col-start-1 lg:row-span-2 lg:row-start-1 ${drawing ? "z-50" : ""}`}
        >
          <LotteryMachine
            dishes={state.dishes}
            draw={state.draw}
            onDrawComplete={room.finishDraw}
            onRevealClose={() => window.setTimeout(() => hubRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 250)}
          />

          <div className="mt-5 text-center">
            {done ? (
              <p className="font-display text-lg font-extrabold text-cocoa-500">
                Đã chốt: <span className="text-mango-600">{state.draw.winner!.emoji} {state.draw.winner!.name}</span> 🎉
              </p>
            ) : canDraw ? (
              <>
                <SquishyButton
                  variant="cherry"
                  size="xl"
                  shiny={!drawing && state.dishes.length >= 2}
                  className="w-full max-w-xs"
                  disabled={drawing || state.dishes.length < 2}
                  onClick={room.startDraw}
                >
                  {drawing ? "Đang quay… 🥁" : "QUAY XỔ SỐ NGAY! 🎰"}
                </SquishyButton>
                <p className="mt-2 text-xs font-bold text-cocoa-300">
                  {state.dishes.length < 2
                    ? `Cần ít nhất 2 món (còn thiếu ${2 - state.dishes.length})`
                    : !isHost && !hostOnline
                      ? "Chủ phòng vắng mặt — bạn quay giúp nhé!"
                      : "Chạm vào lồng để lắc thử 👆"}
                </p>
              </>
            ) : (
              <div className="clay-well mx-auto max-w-xs px-4 py-3">
                <p className="font-display text-lg font-extrabold text-cocoa-500">
                  {drawing ? "Đang quay… 🥁" : <>⏳ Chờ {host ? `${host.avatar} ${host.name}` : "chủ phòng"} quay…</>}
                </p>
                {!drawing && <p className="text-xs font-bold text-cocoa-300">Trong lúc chờ, thả thêm món đi!</p>}
              </div>
            )}

            {isHost && !done && (
              <label className="mx-auto mt-4 flex w-fit cursor-pointer items-center gap-3 rounded-full bg-custard px-4 py-2">
                <span className="text-sm font-bold text-cocoa-500">Cho mọi người cùng quay</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.allowAnyoneDraw}
                  onClick={() => room.setAllowAnyoneDraw(!state.allowAnyoneDraw)}
                  className={`relative h-7 w-12 rounded-full transition-colors ${state.allowAnyoneDraw ? "bg-celery-400" : "bg-peach-200"}`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 600, damping: 30 }}
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${state.allowAnyoneDraw ? "right-1" : "left-1"}`}
                  />
                </button>
              </label>
            )}
          </div>
        </section>

        {/* ---------------- Pool or post-draw hub ---------------- */}
        <div ref={hubRef} className="scroll-mt-20 lg:col-start-2">
          <AnimatePresence mode="wait">
            {done ? (
              <ActionHub
                key="hub"
                roomId={roomId}
                winner={state.draw.winner!}
                notes={state.notes}
                me={me}
                isHost={isHost}
                canDraw={canDraw}
                remainingDishes={state.dishes.length - 1}
                onAddNote={room.addNote}
                onRemoveNote={room.removeNote}
                onRedraw={() => room.resetDraw({ keepDishes: true, removeWinner: true })}
                onNewRound={() => room.resetDraw({ keepDishes: false })}
              />
            ) : (
              <motion.div key="composer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <DishComposer
                  dishes={state.dishes}
                  disabled={drawing}
                  canRemove={(d) => isHost || d.addedById === me.id}
                  onAdd={room.addDish}
                  onRemove={room.removeDish}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} roomId={roomId} url={url} />
    </main>
  );
}

function LoadingScreen({ roomId }: { roomId: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3">
      <motion.div
        className="text-6xl"
        animate={{ rotate: [0, -15, 15, 0], y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        🎰
      </motion.div>
      <p className="font-display text-xl font-extrabold text-cocoa-500">Đang vào phòng {roomId}…</p>
    </main>
  );
}
