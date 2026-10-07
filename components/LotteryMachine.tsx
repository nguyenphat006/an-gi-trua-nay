"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Capsule } from "@/components/Capsule";
import { SquishyButton } from "@/components/SquishyButton";
import { DRAW_DURATION_MS, type Dish, type DrawState } from "@/lib/room";
import { sfx, unlockAudio } from "@/lib/sound";

/* ------------------------------------------------------------------ */
/* Timeline (ms since draw start)                                      */
/* ------------------------------------------------------------------ */

const TUMBLE_END = DRAW_DURATION_MS - 400; // balls rattle, drumroll
const DROP_AT = TUMBLE_END; // golden capsule falls into the chute
const REVEAL_AT = TUMBLE_END + 900; // capsule rolls to center stage
const OPEN_AT = REVEAL_AT + 1400; // POP!

type Stage = "idle" | "tumbling" | "dropping" | "reveal" | "opened";

const CONFETTI_COLORS = ["#FF7A30", "#FFA45B", "#4ADE80", "#FFCB2B", "#FF5A5F", "#FFFFFF"];

/* ------------------------------------------------------------------ */
/* Physics                                                             */
/* ------------------------------------------------------------------ */

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hidden: boolean;
}

/** Ball radius shrinks as the dome fills up so everything still fits. */
function ballRadius(diameter: number, count: number) {
  const ideal = (diameter * 0.36) / Math.sqrt(Math.max(1, count) + 2);
  return Math.min(diameter * 0.12, Math.max(diameter * 0.065, ideal));
}

function useCapsulePhysics(dishes: Dish[], tumbling: boolean, diameterPx: number) {
  const bodies = useRef(new Map<string, Body>());
  const elements = useRef(new Map<string, HTMLDivElement>());
  const diameter = useRef(0);
  const radius = useRef(0);
  const mode = useRef<"idle" | "tumbling">("idle");
  const firstSync = useRef(true);

  // Render-time inputs mirrored into refs for the rAF loop.
  mode.current = tumbling ? "tumbling" : "idle";
  diameter.current = diameterPx;
  radius.current = ballRadius(diameterPx, dishes.length);

  // Keep bodies in sync with the dish list. New ones drop in from the top.
  useLayoutEffect(() => {
    const map = bodies.current;
    const ids = new Set(dishes.map((d) => d.id));
    for (const id of map.keys()) if (!ids.has(id)) map.delete(id);

    const R = Math.max(40, diameter.current / 2 - radius.current);
    for (const d of dishes) {
      if (map.has(d.id)) continue;
      if (firstSync.current) {
        // Initial batch: scatter inside the dome so they don't explode apart.
        const a = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * R * 0.8;
        map.set(d.id, { x: Math.cos(a) * dist, y: Math.sin(a) * dist, vx: 0, vy: 0, angle: Math.random() * 360, hidden: false });
      } else {
        map.set(d.id, {
          x: (Math.random() - 0.5) * R * 0.6,
          y: -R * 0.85,
          vx: (Math.random() - 0.5) * 300,
          vy: 120,
          angle: Math.random() * 360,
          hidden: false,
        });
        sfx.pop(0.9 + Math.random() * 0.35);
      }
    }
    firstSync.current = false;
  }, [dishes]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastClack = 0;

    const step = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000);
      last = t;
      const D = diameter.current;
      const r = radius.current;

      if (D > 0 && r > 0) {
        const s = D / 300; // tune constants for a 300px dome, scale for others
        const R = D / 2 - 8 * s - r;
        const isTumbling = mode.current === "tumbling";
        const live = Array.from(bodies.current.values()).filter((b) => !b.hidden);
        const maxSpeed = (isTumbling ? 2400 : 1600) * s;
        let impact = 0;

        // Forces + integration
        for (const b of live) {
          b.vy += 1700 * s * dt;
          if (isTumbling) {
            // Air jet from the bottom of the dome + swirl + jitter = chaos.
            if (b.y > -R * 0.25) b.vy -= (2400 + Math.random() * 3200) * s * dt;
            b.vx += (Math.random() - 0.5) * 6000 * s * dt;
            const d = Math.hypot(b.x, b.y) || 1;
            b.vx += (-b.y / d) * 1100 * s * dt;
            b.vy += (b.x / d) * 1100 * s * dt;
          }
          const drag = isTumbling ? 0.35 : 1.4;
          b.vx *= 1 - drag * dt;
          b.vy *= 1 - drag * 0.35 * dt;
          const sp = Math.hypot(b.vx, b.vy);
          if (sp > maxSpeed) {
            b.vx *= maxSpeed / sp;
            b.vy *= maxSpeed / sp;
          }
          b.x += b.vx * dt;
          b.y += b.vy * dt;
        }

        // Ball–ball collisions (a couple of relaxation passes)
        const e = isTumbling ? 0.9 : 0.35;
        const minDist = r * 2;
        for (let pass = 0; pass < 3; pass++) {
          for (let i = 0; i < live.length; i++) {
            const a = live[i];
            for (let j = i + 1; j < live.length; j++) {
              const b = live[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const dist2 = dx * dx + dy * dy;
              if (dist2 >= minDist * minDist || dist2 === 0) continue;
              const dist = Math.sqrt(dist2);
              const nx = dx / dist;
              const ny = dy / dist;
              const push = (minDist - dist) / 2;
              a.x -= nx * push;
              a.y -= ny * push;
              b.x += nx * push;
              b.y += ny * push;
              const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (vn < 0) {
                const j2 = (-(1 + e) * vn) / 2;
                a.vx -= j2 * nx;
                a.vy -= j2 * ny;
                b.vx += j2 * nx;
                b.vy += j2 * ny;
                if (pass === 0) impact = Math.max(impact, -vn);
              }
            }
          }
        }

        // Dome wall
        const ew = isTumbling ? 0.8 : 0.4;
        for (const b of live) {
          const d = Math.hypot(b.x, b.y);
          if (d <= R) continue;
          const nx = b.x / d;
          const ny = b.y / d;
          b.x = nx * R;
          b.y = ny * R;
          const vn = b.vx * nx + b.vy * ny;
          if (vn > 0) {
            b.vx -= (1 + ew) * vn * nx;
            b.vy -= (1 + ew) * vn * ny;
            // Rolling friction along the glass
            b.vx *= 0.985;
            b.vy *= 0.985;
            impact = Math.max(impact, vn);
          }
        }

        if (impact > 160 * s && t - lastClack > (isTumbling ? 40 : 70)) {
          sfx.clack(impact / (1500 * s));
          lastClack = t;
        }

        // Render straight to the DOM — no React re-render per frame.
        for (const [id, b] of bodies.current) {
          const el = elements.current.get(id);
          if (!el) continue;
          b.angle += ((b.vx / r) * dt * 180) / Math.PI;
          el.style.transform = `translate3d(${b.x + D / 2 - r}px, ${b.y + D / 2 - r}px, 0) rotate(${b.angle}deg)`;
          el.style.opacity = b.hidden ? "0" : "1";
        }
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nudge = useCallback(() => {
    const s = diameter.current / 300;
    for (const b of bodies.current.values()) {
      b.vy -= (700 + Math.random() * 700) * s;
      b.vx += (Math.random() - 0.5) * 900 * s;
    }
  }, []);

  const setHidden = useCallback((id: string | undefined, hidden: boolean) => {
    for (const [bid, b] of bodies.current) {
      if (!id || bid === id) b.hidden = hidden;
      if (!hidden && bid === id) {
        b.x = 0;
        b.y = -diameter.current * 0.3;
      }
    }
  }, []);

  const bindElement = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) elements.current.set(id, el);
      else elements.current.delete(id);
    },
    [],
  );

  return { nudge, setHidden, bindElement };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface LotteryMachineProps {
  dishes: Dish[];
  draw: DrawState;
  onDrawComplete(drawId: string): void;
  onRevealClose?(): void;
}

export function LotteryMachine({ dishes, draw, onDrawComplete, onRevealClose }: LotteryMachineProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [reveal, setReveal] = useState<Dish | null>(null);
  const [diameterPx, setDiameterPx] = useState(0);
  const domeRef = useRef<HTMLDivElement>(null);
  const domeControls = useAnimationControls();
  const onCompleteRef = useRef(onDrawComplete);
  onCompleteRef.current = onDrawComplete;

  const tumbling = stage === "tumbling";
  const physics = useCapsulePhysics(dishes, tumbling, diameterPx);
  const { setHidden } = physics;

  // Measure the dome responsively.
  useLayoutEffect(() => {
    const el = domeRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setDiameterPx(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Drive the draw timeline from the shared start time so late joiners stay in sync.
  useEffect(() => {
    if (draw.status !== "drawing" || !draw.drawId || !draw.startedAt || !draw.winner) return;
    const { drawId, winner } = draw;
    const elapsed = Date.now() - draw.startedAt;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, Math.max(0, ms - elapsed)));
    let stopDrum = () => {};

    setHidden(undefined, false);
    if (elapsed < TUMBLE_END) {
      setStage("tumbling");
      const remaining = TUMBLE_END - elapsed;
      if (remaining > 400) stopDrum = sfx.drumroll(remaining / 1000);
    }
    at(DROP_AT, () => {
      setHidden(winner.id, true);
      setStage("dropping");
      sfx.whoosh();
    });
    at(REVEAL_AT, () => {
      setReveal(winner);
      setStage("reveal");
      sfx.roll(0.9);
    });
    at(OPEN_AT, () => {
      setStage("opened");
      onCompleteRef.current(drawId);
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      stopDrum();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw.status, draw.drawId, draw.startedAt]);

  // Reset / late-join handling.
  useEffect(() => {
    if (draw.status === "idle") {
      setStage("idle");
      setReveal(null);
      setHidden(undefined, false);
    } else if (draw.status === "done" && draw.winner) {
      setHidden(draw.winner.id, true);
      setStage("opened");
    }
  }, [draw.status, draw.winner, setHidden]);

  const handleDomeTap = () => {
    if (stage !== "idle" || dishes.length === 0) return;
    unlockAudio();
    physics.nudge();
    void domeControls.start({ rotate: [0, -4, 4, -2, 0], transition: { duration: 0.45 } });
  };

  const closeReveal = () => {
    setReveal(null);
    onRevealClose?.();
  };

  const r = ballRadius(diameterPx, dishes.length);
  const winnerInTray = (stage === "dropping" || (stage === "opened" && !reveal)) && !!draw.winner;

  return (
    <>
      <motion.div
        className="relative mx-auto flex w-full max-w-[340px] select-none flex-col items-center"
        animate={
          tumbling
            ? { scale: 1.06, x: [0, -4, 4, -3, 3, 0], rotate: [0, -1.2, 1.2, -0.8, 0.8, 0] }
            : { scale: 1, x: 0, rotate: 0 }
        }
        transition={tumbling ? { duration: 0.32, repeat: Infinity, scale: { type: "spring", stiffness: 200, damping: 15 } } : { type: "spring", stiffness: 260, damping: 18 }}
      >
        {/* Warm glow halo */}
        <div
          className={`pointer-events-none absolute left-1/2 top-[4%] aspect-square w-[95%] -translate-x-1/2 rounded-full blur-3xl transition-colors duration-700 ${
            tumbling ? "bg-gold-300/60" : "bg-peach-300/35"
          }`}
        />

        {/* ---------------- Dome ---------------- */}
        <motion.div
          ref={domeRef}
          animate={domeControls}
          onPointerDown={handleDomeTap}
          role="img"
          aria-label={`Lồng xổ số có ${dishes.length} món`}
          className="glass-dome perspective relative z-10 aspect-square w-[86%] cursor-pointer overflow-hidden rounded-full"
        >
          {dishes.map((d) => (
            <div key={d.id} ref={physics.bindElement(d.id)} className="absolute left-0 top-0 opacity-0 will-change-transform" style={{ width: r * 2, height: r * 2 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 14 }}>
                <Capsule color={d.color} emoji={d.emoji} size={r * 2} />
              </motion.div>
            </div>
          ))}

          {/* Spinning wire cage (pure CSS 3D) */}
          <motion.div
            key={tumbling ? "fast" : "slow"}
            className="preserve-3d pointer-events-none absolute inset-[3%]"
            animate={{ rotateY: 360 }}
            transition={{ repeat: Infinity, ease: "linear", duration: tumbling ? 0.8 : 16 }}
          >
            {[0, 45, 90, 135].map((deg) => (
              <div
                key={deg}
                className="absolute inset-0 rounded-full border-[3px] border-mango-400/30"
                style={{ transform: `rotateY(${deg}deg)` }}
              />
            ))}
          </motion.div>
          <div className="pointer-events-none absolute inset-x-[3%] top-1/2 h-[16%] -translate-y-1/2 rounded-[50%] border-[3px] border-mango-400/25" />

          {/* Gloss */}
          <div className="pointer-events-none absolute left-[15%] top-[8%] h-[20%] w-[34%] -rotate-[28deg] rounded-full bg-gradient-to-b from-white/90 to-white/0" />
          <div className="pointer-events-none absolute bottom-[12%] right-[14%] h-[7%] w-[14%] -rotate-[30deg] rounded-full bg-white/50" />

          {dishes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
              <span className="animate-float text-5xl">🫙</span>
              <p className="mt-2 font-display text-lg font-bold text-cocoa-400">Lồng còn trống!</p>
              <p className="text-sm font-semibold text-cocoa-300">Thả vài món vào nha 👇</p>
            </div>
          )}
        </motion.div>

        {/* ---------------- Collar ---------------- */}
        <div className="relative z-20 -mt-[5%] h-7 w-[58%] rounded-2xl bg-gradient-to-b from-peach-300 via-mango-400 to-mango-600 shadow-btn-mango">
          <div className="absolute inset-x-3 top-1 h-1.5 rounded-full bg-white/50" />
        </div>

        {/* ---------------- Base ---------------- */}
        <div className="relative z-10 -mt-1 w-full rounded-b-[2rem] rounded-t-[2.4rem] bg-gradient-to-b from-mango-400 via-mango-500 to-mango-600 px-4 pb-4 pt-4 shadow-clay-lg">
          <div className="pointer-events-none absolute inset-x-6 top-2 h-2 rounded-full bg-white/35" />

          <div className="flex items-center justify-between gap-3">
            <div className="pl-1">
              <p className="font-display text-2xl font-extrabold leading-none text-white [text-shadow:0_3px_0_#C74A10]">
                LUNCH<span className="text-gold-300">BOX</span>
              </p>
              <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-mango-100">
                {dishes.length} viên · Xổ số món ăn
              </p>
            </div>

            {/* Crank handle */}
            <div className="relative h-14 w-14 shrink-0 rounded-full bg-gradient-to-b from-white to-peach-100 shadow-btn-soft">
              <motion.div
                key={tumbling ? "crank-fast" : "crank-slow"}
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: "linear", duration: tumbling ? 0.45 : 10 }}
              >
                <div className="absolute left-1/2 top-1/2 h-2.5 w-[70%] -translate-y-1/2 rounded-full bg-mango-500" />
                <div className="absolute right-[2%] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-gradient-to-b from-cherry-400 to-cherry-600 shadow-[0_2px_0_#8E1520]" />
              </motion.div>
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mango-600" />
            </div>
          </div>

          {/* Prize chute */}
          <div className="relative mx-auto mt-3 h-[72px] w-[132px] overflow-hidden rounded-[1.4rem] bg-gradient-to-b from-cocoa-900 to-cocoa-700 shadow-[inset_0_8px_14px_rgba(0,0,0,0.5),0_3px_0_rgba(255,255,255,0.35)]">
            <div className="absolute inset-x-3 top-0 h-3 rounded-b-xl bg-black/30" />
            <AnimatePresence>
              {winnerInTray && draw.winner && (
                <motion.div
                  key={draw.drawId}
                  className="absolute bottom-1.5 left-1/2 -ml-[25px]"
                  initial={stage === "dropping" ? { y: -80, rotate: -120, opacity: 0 } : false}
                  animate={{ y: [null, 6, -8, 0], rotate: 0, opacity: 1 }}
                  exit={{ x: 120, rotate: 220, opacity: 0, transition: { duration: 0.45 } }}
                  transition={{ duration: 0.75, ease: "easeOut" }}
                >
                  <Capsule gold color="#FFCB2B" emoji={draw.winner.emoji} size={50} />
                  <div className="pointer-events-none absolute inset-0 rounded-full shadow-glow" />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Flap */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-mango-600/90 to-transparent" />
          </div>
        </div>

        {/* Floor shadow */}
        <div className="mt-2 h-4 w-[80%] rounded-[50%] bg-cocoa-700/15 blur-md" />
      </motion.div>

      <RevealOverlay winner={reveal} opened={stage === "opened"} onClose={closeReveal} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal: capsule rolls to center stage → wobbles → POPS → trophy     */
/* ------------------------------------------------------------------ */

function fireConfetti() {
  const base = { colors: CONFETTI_COLORS, disableForReducedMotion: true, zIndex: 120 };
  void confetti({ ...base, particleCount: 160, spread: 100, startVelocity: 55, origin: { y: 0.5 }, scalar: 1.15 });
  void confetti({ ...base, particleCount: 60, spread: 360, startVelocity: 30, origin: { y: 0.45 }, shapes: ["star"], scalar: 1.4 });
  const end = Date.now() + 1600;
  const cannons = () => {
    void confetti({ ...base, particleCount: 6, angle: 60, spread: 55, origin: { x: 0, y: 0.75 } });
    void confetti({ ...base, particleCount: 6, angle: 120, spread: 55, origin: { x: 1, y: 0.75 } });
    if (Date.now() < end) requestAnimationFrame(cannons);
  };
  cannons();
}

function RevealOverlay({ winner, opened, onClose }: { winner: Dish | null; opened: boolean; onClose(): void }) {
  const [mounted, setMounted] = useState(false);
  const shown = !!winner;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!shown || !opened) return;
    sfx.burst();
    fireConfetti();
    const t = window.setTimeout(() => sfx.fanfare(), 180);
    navigator.vibrate?.([30, 40, 80]);
    return () => window.clearTimeout(t);
  }, [shown, opened]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {winner && (
        <motion.div
          key="reveal"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-cocoa-900/60 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => opened && onClose()}
        >
          {/* Rotating sun rays */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[180vmax] w-[180vmax] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,203,43,0.22) 0deg 10deg, transparent 10deg 24deg)",
              maskImage: "radial-gradient(circle, black 0%, transparent 45%)",
              WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 45%)",
            }}
            animate={{ rotate: 360, scale: opened ? 1.15 : 0.9 }}
            transition={{ rotate: { repeat: Infinity, duration: 30, ease: "linear" }, scale: { duration: 0.6 } }}
          />

          <div className="relative flex w-full max-w-sm flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* The capsule — rolls in, wobbles, splits */}
            <motion.div
              className="relative z-10"
              initial={{ x: -220, y: 220, rotate: -720, scale: 0.4 }}
              animate={
                opened
                  ? { x: 0, y: -10, rotate: 0, scale: 1.2 }
                  : { x: 0, y: 0, rotate: [0, -14, 14, -10, 10, -6, 6, 0], scale: [1, 1.04, 1] }
              }
              transition={
                opened
                  ? { type: "spring", stiffness: 260, damping: 12 }
                  : {
                      x: { type: "spring", stiffness: 120, damping: 14 },
                      y: { type: "spring", stiffness: 120, damping: 14 },
                      rotate: { delay: 0.6, duration: 0.7, repeat: Infinity, repeatDelay: 0.05 },
                      scale: { delay: 0.6, duration: 0.35, repeat: Infinity },
                    }
              }
            >
              {!opened && <div className="absolute inset-0 animate-pulse rounded-full shadow-glow" />}
              <Capsule gold color="#FFCB2B" emoji={winner.emoji} size={150} open={opened} />
            </motion.div>

            <AnimatePresence>
              {!opened && (
                <motion.p
                  className="mt-6 font-display text-2xl font-extrabold text-white [text-shadow:0_3px_0_rgba(0,0,0,0.25)]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  Và món trưa nay là…
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {opened && <TrophyCard dish={winner} onClose={onClose} />}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function TrophyCard({ dish, onClose }: { dish: Dish; onClose(): void }) {
  return (
    <motion.div
      className="-mt-8 w-full rounded-[2.2rem] bg-gradient-to-br from-gold-200 via-gold-400 to-mango-400 p-[4px] shadow-[0_30px_60px_-15px_rgba(245,179,0,0.6)]"
      initial={{ scale: 0.3, y: 60, opacity: 0, rotate: -6 }}
      animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.15 }}
    >
      <div className="shine relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-white to-cream px-6 pb-6 pt-10 text-center">
        <span className="pill bg-gold-200 text-[13px] uppercase tracking-wider text-gold-600">🏆 Trưa nay cả team ăn</span>
        <motion.div
          className="my-2 text-7xl"
          animate={{ y: [0, -8, 0], rotate: [0, -6, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          {dish.emoji}
        </motion.div>
        <h2 className="text-balance font-display text-4xl font-extrabold leading-tight text-cocoa-900">{dish.name}</h2>
        <p className="mt-1 text-sm font-bold text-cocoa-400">Viên nang của {dish.addedByName} ✨</p>
        <SquishyButton variant="mango" size="lg" className="mt-5 w-full" onClick={onClose}>
          Chốt đơn thôi! 🛵
        </SquishyButton>
      </div>
    </motion.div>
  );
}
