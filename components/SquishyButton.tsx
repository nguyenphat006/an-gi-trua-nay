"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { sfx, unlockAudio } from "@/lib/sound";

type Variant = "mango" | "cherry" | "celery" | "soft" | "ghost";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  mango: "bg-gradient-to-b from-mango-300 to-mango-500 text-white shadow-btn-mango active:shadow-btn-mango-pressed",
  cherry: "bg-gradient-to-b from-cherry-400 to-cherry-600 text-white shadow-btn-cherry",
  celery: "bg-gradient-to-b from-celery-300 to-celery-500 text-cocoa-900 shadow-btn-celery",
  soft: "bg-white text-cocoa-700 shadow-btn-soft border border-peach-100",
  ghost: "bg-transparent text-cocoa-500 hover:bg-mango-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-base rounded-2xl gap-2",
  lg: "h-14 px-7 text-lg rounded-2xl gap-2.5",
  xl: "h-[4.5rem] px-8 text-2xl rounded-3xl gap-3",
};

export interface SquishyButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
  /** Play the default click sound (set false when the handler plays its own). */
  sound?: boolean;
  shiny?: boolean;
}

/** Clay button that squashes on press and stretches on hover. */
export const SquishyButton = forwardRef<HTMLButtonElement, SquishyButtonProps>(function SquishyButton(
  { variant = "mango", size = "md", sound = true, shiny = false, className = "", onClick, disabled, children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.05, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.94, scaleY: 0.9, y: 3 }}
      transition={{ type: "spring", stiffness: 500, damping: 17 }}
      onClick={(e) => {
        unlockAudio();
        if (sound) sfx.click();
        onClick?.(e);
      }}
      className={`relative inline-flex select-none items-center justify-center overflow-hidden font-display font-extrabold tracking-wide transition-[box-shadow,opacity] disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50 ${
        shiny ? "shine" : ""
      } ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
