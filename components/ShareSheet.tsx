"use client";

import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { SquishyButton } from "@/components/SquishyButton";
import { sfx } from "@/lib/sound";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts (e.g. LAN IP on mobile during testing)
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function ShareSheet({ open, onClose, roomId, url }: { open: boolean; onClose(): void; roomId: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await copyText(url)) {
      sfx.sparkle();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "Trưa nay ăn gì? 🎰", text: `Vào phòng ${roomId} bốc thăm món trưa nè!`, url });
    } catch {
      /* dismissed */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-cocoa-900/40 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="clay-card w-full max-w-sm rounded-b-none p-6 text-center sm:rounded-b-4xl"
            initial={{ y: 80, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-peach-200 sm:hidden" />
            <h3 className="text-2xl font-extrabold text-cocoa-900">Rủ cả team vào! 📣</h3>
            <p className="text-sm font-semibold text-cocoa-400">Quét QR hoặc gửi link qua Zalo / Slack</p>

            <motion.div
              className="mx-auto mt-4 w-fit rounded-3xl bg-white p-4 shadow-clay"
              initial={{ rotate: -4 }}
              animate={{ rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 8 }}
            >
              <QRCodeSVG value={url} size={176} fgColor="#4A2C1A" bgColor="#FFFFFF" level="M" />
            </motion.div>

            <div className="mt-4 rounded-2xl bg-custard px-3 py-2 font-display text-3xl font-extrabold tracking-[0.25em] text-mango-600">
              {roomId}
            </div>
            <p className="mt-2 truncate text-xs font-semibold text-cocoa-300">{url}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <SquishyButton variant={copied ? "celery" : "mango"} onClick={copy} sound={false}>
                {copied ? "Đã copy ✓" : "Copy link 🔗"}
              </SquishyButton>
              {typeof navigator !== "undefined" && "share" in navigator ? (
                <SquishyButton variant="soft" onClick={nativeShare}>
                  Chia sẻ 📤
                </SquishyButton>
              ) : (
                <SquishyButton variant="soft" onClick={onClose}>
                  Xong
                </SquishyButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
