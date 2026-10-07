"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Capsule } from "@/components/Capsule";
import { MAX_DISH_NAME, PRESET_DISHES, sameDish, type Dish } from "@/lib/room";
import { sfx, unlockAudio } from "@/lib/sound";

interface Props {
  dishes: Dish[];
  disabled: boolean;
  canRemove(dish: Dish): boolean;
  onAdd(name: string): string | null;
  onRemove(id: string): void;
}

export function DishComposer({ dishes, disabled, canRemove, onAdd, onRemove }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const submit = (name: string) => {
    unlockAudio();
    const err = onAdd(name);
    if (err) {
      setError(err);
      setShakeKey((k) => k + 1);
      sfx.boing();
      return false;
    }
    setError(null);
    return true;
  };

  return (
    <div className="clay-card p-4 sm:p-5">
      <h2 className="text-xl font-extrabold text-cocoa-900">Thả món vào lồng 🫳</h2>

      <motion.form
        key={shakeKey}
        className="mt-3 flex gap-2"
        animate={shakeKey ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (submit(value)) setValue("");
        }}
      >
        <input
          className="clay-input"
          placeholder="VD: Bún đậu mắm tôm…"
          value={value}
          maxLength={MAX_DISH_NAME}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
        />
        <motion.button
          type="submit"
          disabled={disabled || !value.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          className="h-[52px] shrink-0 rounded-2xl bg-gradient-to-b from-celery-300 to-celery-500 px-5 font-display text-lg font-extrabold text-cocoa-900 shadow-btn-celery disabled:opacity-50"
        >
          Thả!
        </motion.button>
      </motion.form>

      <AnimatePresence>
        {error && (
          <motion.p
            className="mt-2 text-sm font-bold text-cherry-500"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* One-tap presets */}
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESET_DISHES.map((p, i) => {
          const taken = dishes.some((d) => sameDish(d.name, p));
          return (
            <motion.button
              key={p}
              type="button"
              disabled={disabled || taken}
              onClick={() => submit(p)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: taken ? 0.4 : 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={taken ? undefined : { scale: 1.07, rotate: -2 }}
              whileTap={taken ? undefined : { scale: 0.9 }}
              className="pill border-2 border-dashed border-peach-300 bg-peach-100/60 text-mango-700 disabled:cursor-default disabled:line-through"
            >
              + {p}
            </motion.button>
          );
        })}
      </div>

      {/* Current pool */}
      {dishes.length > 0 && (
        <div className="mt-4 border-t-2 border-dashed border-peach-100 pt-3">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-cocoa-400">Trong lồng ({dishes.length})</p>
          <ul className="flex flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {dishes.map((d) => (
                <motion.li
                  key={d.id}
                  layout
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2 shadow-puffy ring-1 ring-peach-100"
                  title={`Thả bởi ${d.addedByName}`}
                >
                  <Capsule color={d.color} emoji={d.emoji} size={26} />
                  <span className="text-sm font-bold text-cocoa-700">{d.name}</span>
                  {canRemove(d) && !disabled && (
                    <button
                      type="button"
                      aria-label={`Bỏ ${d.name}`}
                      onClick={() => {
                        sfx.boing();
                        onRemove(d.id);
                      }}
                      className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-custard text-xs font-black text-cocoa-400 hover:bg-cherry-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  );
}
