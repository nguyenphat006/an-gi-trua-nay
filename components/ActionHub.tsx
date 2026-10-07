"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Capsule } from "@/components/Capsule";
import { copyText } from "@/components/ShareSheet";
import { SquishyButton } from "@/components/SquishyButton";
import { foodLinks, formatOrderSummary, MAX_NOTE, type Dish, type Member, type OrderNote } from "@/lib/room";
import { sfx } from "@/lib/sound";

interface Props {
  roomId: string;
  winner: Dish;
  notes: OrderNote[];
  me: Member;
  isHost: boolean;
  canDraw: boolean;
  remainingDishes: number;
  onAddNote(text: string): void;
  onRemoveNote(id: string): void;
  onRedraw(): void;
  onNewRound(): void;
}

export function ActionHub({ roomId, winner, notes, me, isHost, canDraw, remainingDishes, onAddNote, onRemoveNote, onRedraw, onNewRound }: Props) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const links = foodLinks(winner.name);
  const sorted = notes.slice().sort((a, b) => a.createdAt - b.createdAt);

  const copyAll = async () => {
    if (await copyText(formatOrderSummary(winner, notes, roomId))) {
      sfx.sparkle();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.section
      className="space-y-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      {/* Trophy showcase */}
      <div className="rounded-[2.2rem] bg-gradient-to-br from-gold-200 via-gold-400 to-mango-400 p-[3px] shadow-clay-lg">
        <div className="shine relative flex items-center gap-4 overflow-hidden rounded-[2.1rem] bg-gradient-to-br from-white to-cream p-5">
          <motion.div animate={{ rotate: [0, -8, 8, 0], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.6 }}>
            <Capsule gold color="#FFCB2B" emoji={winner.emoji} size={76} open />
          </motion.div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-widest text-gold-600">🏆 Món thắng cuộc</p>
            <h2 className="truncate text-3xl font-extrabold leading-tight text-cocoa-900 sm:text-4xl">{winner.name}</h2>
            <p className="text-sm font-bold text-cocoa-400">Viên của {winner.addedByName}</p>
          </div>
        </div>
      </div>

      {/* Deep links */}
      <div className="grid grid-cols-3 gap-2.5">
        <DeepLink href={links.shopee} emoji="🛵" label="ShopeeFood" className="from-[#FF8A5B] to-[#EE4D2D] text-white" />
        <DeepLink href={links.grab} emoji="🟢" label="GrabFood" className="from-[#3DDC84] to-[#00B14F] text-white" />
        <DeepLink href={links.maps} emoji="📍" label="Quán gần đây" className="from-white to-peach-100 text-cocoa-700" />
      </div>

      {/* Group notes */}
      <div className="clay-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-extrabold text-cocoa-900">Chốt đơn 📝</h3>
          <span className="pill bg-celery-100 text-celery-600">{notes.length} phần</span>
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onAddNote(text);
            sfx.pop(1.2);
            setText("");
          }}
        >
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-custard text-2xl">{me.avatar}</span>
          <input
            className="clay-input"
            value={text}
            maxLength={MAX_NOTE}
            onChange={(e) => setText(e.target.value)}
            placeholder={`VD: ${winner.name} nhiều ớt, ít hành`}
          />
          <motion.button
            type="submit"
            disabled={!text.trim()}
            whileTap={{ scale: 0.88 }}
            className="h-[52px] shrink-0 rounded-2xl bg-gradient-to-b from-mango-300 to-mango-500 px-4 font-display font-extrabold text-white shadow-btn-mango disabled:opacity-50"
          >
            Ghi
          </motion.button>
        </form>

        <ul className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {sorted.map((n, i) => (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="flex items-start gap-3 rounded-2xl bg-custard px-3 py-2.5"
              >
                <span className="mt-0.5 text-xl">{n.avatar}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-cocoa-400">
                    #{i + 1} · {n.name}
                  </p>
                  <p className="break-words font-bold text-cocoa-700">{n.text}</p>
                </div>
                {(n.memberId === me.id || isHost) && (
                  <button
                    aria-label="Xoá ghi chú"
                    onClick={() => {
                      sfx.boing();
                      onRemoveNote(n.id);
                    }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-cocoa-300 hover:bg-cherry-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
          {notes.length === 0 && <li className="py-3 text-center text-sm font-semibold text-cocoa-300">Chưa ai ghi món — làm người đầu tiên nhé! 🙋</li>}
        </ul>

        <SquishyButton variant={copied ? "celery" : "mango"} size="lg" className="mt-4 w-full" onClick={copyAll} sound={false}>
          {copied ? "Đã copy! Dán vào Zalo thôi ✓" : "Copy toàn bộ đơn 📋"}
        </SquishyButton>
      </div>

      {/* Next round */}
      {canDraw && (
        <div className="grid grid-cols-2 gap-3">
          <SquishyButton variant="soft" onClick={onRedraw} disabled={remainingDishes < 2}>
            🔁 Quay lại (bỏ món này)
          </SquishyButton>
          <SquishyButton variant="soft" onClick={onNewRound}>
            🧺 Ván mới
          </SquishyButton>
        </div>
      )}
    </motion.section>
  );
}

function DeepLink({ href, emoji, label, className }: { href: string; emoji: string; label: string; className: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => sfx.click()}
      className={`flex flex-col items-center justify-center gap-1 rounded-3xl bg-gradient-to-b px-2 py-3 text-center shadow-clay ${className}`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="font-display text-sm font-extrabold leading-tight">{label}</span>
    </motion.a>
  );
}
