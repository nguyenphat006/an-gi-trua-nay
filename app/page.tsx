"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Capsule } from "@/components/Capsule";
import { SquishyButton } from "@/components/SquishyButton";
import { claimHost } from "@/lib/identity";
import { CAPSULE_COLORS, generateRoomCode, isValidRoomCode, normalizeRoomCode } from "@/lib/room";
import { sfx } from "@/lib/sound";

const HERO_CAPSULES = [
  { emoji: "🍜", x: "8%", y: "12%", size: 64, delay: 0 },
  { emoji: "🍱", x: "78%", y: "6%", size: 72, delay: 0.4 },
  { emoji: "🍗", x: "86%", y: "52%", size: 54, delay: 0.8 },
  { emoji: "🥖", x: "2%", y: "58%", size: 58, delay: 1.2 },
  { emoji: "🧋", x: "70%", y: "80%", size: 50, delay: 0.6 },
  { emoji: "🥗", x: "16%", y: "86%", size: 46, delay: 1 },
];

export default function LandingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const normalized = normalizeRoomCode(code);

  const createRoom = () => {
    setCreating(true);
    sfx.pop();
    const id = generateRoomCode();
    claimHost(id);
    router.push(`/room/${id}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidRoomCode(normalized)) return;
    sfx.pop(1.2);
    router.push(`/room/${normalized}`);
  };

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-8 sm:max-w-lg">
      {/* Floating capsules */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {HERO_CAPSULES.map((c, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: c.x, top: c.y }}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0, y: [0, -14, 0] }}
            transition={{
              scale: { type: "spring", delay: c.delay * 0.5, stiffness: 300, damping: 12 },
              rotate: { type: "spring", delay: c.delay * 0.5 },
              y: { repeat: Infinity, duration: 3 + i * 0.4, ease: "easeInOut", delay: c.delay },
            }}
          >
            <Capsule color={CAPSULE_COLORS[i % CAPSULE_COLORS.length]} emoji={c.emoji} size={c.size} className="opacity-90" />
          </motion.div>
        ))}
      </div>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          className="pill mb-4 bg-white text-mango-600 shadow-puffy"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
        >
          🎰 Máy xổ số món ăn trưa
        </motion.div>

        <motion.h1
          className="text-balance text-5xl font-extrabold leading-[0.95] text-cocoa-900 sm:text-6xl"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
        >
          Trưa nay
          <br />
          <span className="relative inline-block bg-gradient-to-b from-mango-400 to-mango-600 bg-clip-text text-transparent">
            ăn gì?
            <motion.span
              className="absolute -right-10 -top-3 text-4xl"
              animate={{ rotate: [0, 18, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, repeatDelay: 1 }}
            >
              🤔
            </motion.span>
          </span>
        </motion.h1>

        <motion.p
          className="mt-4 max-w-xs text-balance text-base font-semibold text-cocoa-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          Cả team thả món vào lồng, chủ phòng quay — 3 phút là chốt. Không cãi nhau, không vote nhàm chán!
        </motion.p>

        <motion.div
          className="mt-8 w-full"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", delay: 0.45 }}
        >
          <SquishyButton size="xl" shiny className="w-full" onClick={createRoom} disabled={creating} sound={false}>
            {creating ? "Đang dọn bàn…" : "Tạo Phòng Ăn Trưa 🍱"}
          </SquishyButton>
          <p className="mt-2 text-xs font-bold text-cocoa-300">Không cần đăng nhập · Miễn phí · Chạy trên điện thoại</p>
        </motion.div>

        <motion.form
          onSubmit={joinRoom}
          className="clay-card mt-8 w-full p-4 text-left"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", delay: 0.55 }}
        >
          <label htmlFor="code" className="text-sm font-extrabold text-cocoa-500">
            Có mã phòng rồi?
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="code"
              className="clay-input font-display text-xl uppercase tracking-[0.3em] placeholder:tracking-normal"
              placeholder="VD: K7M2QP"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
            />
            <SquishyButton type="submit" variant="celery" size="lg" disabled={!isValidRoomCode(normalized)} sound={false}>
              Vào
            </SquishyButton>
          </div>
        </motion.form>
      </section>

      <footer className="relative z-10 mt-10 grid grid-cols-3 gap-3 text-center">
        {[
          ["🫳", "Thả món"],
          ["🎰", "Quay xổ số"],
          ["🛵", "Chốt đơn"],
        ].map(([emoji, label], i) => (
          <motion.div
            key={label}
            className="clay-card px-2 py-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
          >
            <div className="text-2xl">{emoji}</div>
            <p className="mt-1 text-xs font-extrabold text-cocoa-500">
              {i + 1}. {label}
            </p>
          </motion.div>
        ))}
      </footer>
    </main>
  );
}
