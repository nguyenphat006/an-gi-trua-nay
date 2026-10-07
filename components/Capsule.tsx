"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";

interface CapsuleProps {
  color: string;
  emoji: string;
  size: number;
  gold?: boolean;
  /** 0 = closed, 1 = fully split open. */
  open?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Two-piece gashapon capsule: tinted top shell + milky bottom shell.
 * Rendered with layered gradients for a glossy, toy-plastic 3D look.
 */
export function Capsule({ color, emoji, size, gold = false, open = false, className = "", style }: CapsuleProps) {
  const top = gold
    ? "radial-gradient(circle at 32% 30%, #FFFBE0 0, #FFE066 22%, #F5B300 62%, #B87800 100%)"
    : `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85) 0, ${color} 32%, color-mix(in srgb, ${color} 70%, #3a1d0e) 100%)`;
  const bottom = gold
    ? "radial-gradient(circle at 35% 0%, #FFF8D6 0, #FFD84A 40%, #D99600 100%)"
    : "radial-gradient(circle at 35% 0%, #FFFFFF 0, #FFF6EC 45%, #EFD9C6 100%)";

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size, ...style }}>
      {/* Emoji sits inside, visible through the gap / once opened */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ fontSize: size * 0.5, lineHeight: 1 }}
        animate={open ? { scale: 1.6, y: -size * 0.05 } : { scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 12 }}
      >
        <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.18)]">{emoji}</span>
      </motion.div>

      {/* Top shell */}
      <motion.div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{
          height: size / 2,
          borderTopLeftRadius: size,
          borderTopRightRadius: size,
          background: top,
          boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.12)",
          transformOrigin: "10% 100%",
        }}
        animate={open ? { rotate: -38, x: -size * 0.45, y: -size * 0.55, opacity: 0 } : { rotate: 0, x: 0, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, opacity: { delay: 0.35, duration: 0.3 } }}
      >
        {/* Specular highlight */}
        <div
          className="absolute rounded-full bg-white/70 blur-[1px]"
          style={{ width: size * 0.28, height: size * 0.14, left: size * 0.18, top: size * 0.12, transform: "rotate(-25deg)" }}
        />
        {/* Window that hints at the emoji inside */}
        {!gold && (
          <div
            className="absolute flex items-end justify-center overflow-hidden rounded-t-full bg-white/35"
            style={{ width: size * 0.56, height: size * 0.3, left: size * 0.22, bottom: 0 }}
          >
            <span style={{ fontSize: size * 0.42, lineHeight: 1, transform: `translateY(${size * 0.21}px)` }}>{emoji}</span>
          </div>
        )}
        {gold && (
          <div className="absolute inset-0 flex items-center justify-center pt-[12%] font-display font-extrabold text-white/90" style={{ fontSize: size * 0.24 }}>
            ★
          </div>
        )}
      </motion.div>

      {/* Bottom shell */}
      <motion.div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: size / 2,
          borderBottomLeftRadius: size,
          borderBottomRightRadius: size,
          background: bottom,
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -4px 6px rgba(122,78,54,0.18)",
          transformOrigin: "90% 0%",
        }}
        animate={open ? { rotate: 32, x: size * 0.45, y: size * 0.5, opacity: 0 } : { rotate: 0, x: 0, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, opacity: { delay: 0.35, duration: 0.3 } }}
      />

      {/* Seam ring */}
      {!open && (
        <div
          className="pointer-events-none absolute inset-x-[3%] top-1/2 -translate-y-1/2 rounded-full"
          style={{ height: Math.max(2, size * 0.05), background: gold ? "#B87800" : "rgba(58,29,14,0.18)" }}
        />
      )}
    </div>
  );
}
