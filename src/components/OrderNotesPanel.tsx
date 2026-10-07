'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCopy, Check, Send, Trash2, ShoppingBag, MessageSquare } from 'lucide-react';
import { FoodItem, Member, OrderNote } from '@/types';
import { soundFx } from '@/lib/sound';

interface OrderNotesPanelProps {
  roomId: string;
  winningItem: FoodItem | null;
  notes: OrderNote[];
  currentUser: Member;
  onAddNote: (note: string) => void;
  onRemoveNote: (id: string) => void;
}

export const OrderNotesPanel: React.FC<OrderNotesPanelProps> = ({
  roomId,
  winningItem,
  notes,
  currentUser,
  onAddNote,
  onRemoveNote,
}) => {
  const [noteInput, setNoteInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    soundFx.playPop(620);
    onAddNote(noteInput.trim());
    setNoteInput('');
  };

  const handleCopyOrder = async () => {
    soundFx.playPop(750);
    const dishTitle = winningItem ? `${winningItem.name} ${winningItem.emoji}` : 'Món trưa nhóm';
    
    let text = `🍱 CHỐT ĐƠN TRƯA NAY: ${dishTitle.toUpperCase()}\n`;
    text += `📍 Phòng bốc thăm: ${roomId}\n`;
    text += `⏰ Thời gian chốt: ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}\n`;
    text += `------------------------------------\n`;

    if (notes.length === 0) {
      text += `(Chưa có bạn nào ghi chú phần ăn)\n`;
    } else {
      notes.forEach((item, index) => {
        text += `${index + 1}. ${item.avatar} ${item.memberName}: ${item.note}\n`;
      });
    }

    text += `------------------------------------\n`;
    text += `🛵 Tổng cộng: ${notes.length} suất\n`;
    if (winningItem) {
      text += `👉 ShopeeFood: https://shopeefood.vn/search?keyword=${encodeURIComponent(winningItem.name)}\n`;
      text += `👉 GrabFood: https://food.grab.com/vn/vi/restaurants?search=${encodeURIComponent(winningItem.name)}\n`;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="clay-card p-4 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-black text-orange-950 text-base sm:text-lg leading-tight">
              Chốt Đơn Trưa Nay
            </h3>
            <p className="text-[11px] text-orange-800/70 font-semibold">
              Ghi chú phần ăn và copy sang Zalo / Slack trong 1 nốt nhạc
            </p>
          </div>
        </div>

        {/* 1-Click Copy Action */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          onClick={handleCopyOrder}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all ${
            copied
              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
              : 'clay-btn-primary text-white'
          }`}
          title="Sao chép toàn bộ danh sách đơn đặt"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>ĐÃ COPY ĐƠN!</span>
            </>
          ) : (
            <>
              <ClipboardCopy className="w-3.5 h-3.5" />
              <span>Copy Cho Zalo</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Input Note Form */}
      <form onSubmit={handleSubmitNote} className="flex gap-2">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-100/60 border border-orange-200 text-orange-950 text-xs font-bold shrink-0">
          <span>{currentUser.avatar}</span>
          <span className="hidden sm:inline max-w-[90px] truncate">{currentUser.nickname}</span>
        </div>

        <input
          type="text"
          placeholder="VD: Suất nhiều ớt không hành, 1 ly ít đường..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          maxLength={80}
          className="flex-1 h-10 px-3.5 rounded-xl bg-orange-50/50 border-2 border-orange-200 focus:bg-white focus:outline-none focus:border-orange-500 text-xs sm:text-sm font-semibold text-orange-950 placeholder:text-orange-950/40"
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          type="submit"
          disabled={!noteInput.trim()}
          className="h-10 px-3.5 clay-btn-green rounded-xl text-xs font-bold flex items-center gap-1 text-emerald-950 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Gửi</span>
        </motion.button>
      </form>

      {/* Order Notes List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-orange-900/80 px-1">
          <span>Danh sách mọi người ({notes.length} suất)</span>
        </div>

        {notes.length === 0 ? (
          <div className="py-6 rounded-2xl border-2 border-dashed border-orange-200/80 bg-orange-50/30 text-center text-xs text-orange-800/60 font-semibold flex flex-col items-center gap-1">
            <MessageSquare className="w-5 h-5 text-orange-300" />
            <span>Chưa ai ghi chú suất ăn. Nhập khẩu vị của bạn ở trên nhé!</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-orange-200/70 shadow-2xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{note.avatar}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-orange-950 truncate">
                          {note.memberName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(note.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-orange-900 font-medium break-words">
                        {note.note}
                      </p>
                    </div>
                  </div>

                  {note.memberId === currentUser.id && (
                    <button
                      onClick={() => {
                        soundFx.playPop(380);
                        onRemoveNote(note.id);
                      }}
                      type="button"
                      aria-label="Xóa ghi chú của bạn"
                      className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors shrink-0"
                      title="Xóa ghi chú này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
