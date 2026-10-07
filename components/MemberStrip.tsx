"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SquishyButton } from "@/components/SquishyButton";
import { AVATAR_CHOICES, type Member } from "@/lib/room";

interface Props {
  members: Member[];
  meId?: string;
  onEditProfile(patch: { name: string; avatar: string }): void;
}

export function MemberStrip({ members, meId, onEditProfile }: Props) {
  const [editing, setEditing] = useState(false);
  const me = members.find((m) => m.id === meId);

  return (
    <div className="clay-card px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-widest text-cocoa-400">
          Đang trong phòng <span className="ml-1 rounded-full bg-celery-100 px-2 py-0.5 text-celery-600">{members.length}</span>
        </p>
        {me && (
          <button className="text-xs font-extrabold text-mango-600 underline-offset-2 hover:underline" onClick={() => setEditing(true)}>
            Đổi tên ✏️
          </button>
        )}
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <AnimatePresence initial={false}>
          {members.map((m, i) => (
            <motion.div
              key={m.id}
              layout
              initial={{ scale: 0, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className={`flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 ${
                m.id === meId ? "bg-mango-100 ring-2 ring-mango-300" : "bg-custard"
              }`}
            >
              <span
                className="flex h-8 w-8 animate-float items-center justify-center rounded-full bg-white text-lg shadow-puffy"
                style={{ animationDelay: `${(i % 5) * 0.35}s` }}
              >
                {m.avatar}
              </span>
              <span className="max-w-[9rem] truncate text-sm font-bold text-cocoa-700">
                {m.name}
                {m.id === meId && <span className="text-cocoa-400"> (bạn)</span>}
              </span>
              {m.isHost && <span title="Chủ phòng">👑</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>{editing && me && <ProfileEditor me={me} onClose={() => setEditing(false)} onSave={onEditProfile} />}</AnimatePresence>
    </div>
  );
}

function ProfileEditor({ me, onClose, onSave }: { me: Member; onClose(): void; onSave(p: { name: string; avatar: string }): void }) {
  const [name, setName] = useState(me.name);
  const [avatar, setAvatar] = useState(me.avatar);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-cocoa-900/40 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        className="clay-card w-full max-w-sm rounded-b-none p-6 sm:rounded-b-4xl"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, avatar });
          onClose();
        }}
      >
        <h3 className="text-center text-2xl font-extrabold text-cocoa-900">Bạn là ai nè? {avatar}</h3>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {AVATAR_CHOICES.map((a) => (
            <motion.button
              key={a}
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={() => setAvatar(a)}
              className={`flex aspect-square items-center justify-center rounded-2xl text-2xl transition-colors ${
                a === avatar ? "bg-mango-100 ring-2 ring-mango-400" : "bg-custard"
              }`}
            >
              {a}
            </motion.button>
          ))}
        </div>
        <input
          autoFocus
          className="clay-input mt-4"
          value={name}
          maxLength={28}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên của bạn"
        />
        <SquishyButton type="submit" className="mt-4 w-full" disabled={!name.trim()}>
          Lưu lại ✨
        </SquishyButton>
      </motion.form>
    </motion.div>
  );
}
