'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Utensils, Sparkles } from 'lucide-react';
import { FoodItem, Member } from '@/types';
import { FOOD_PRESETS, getRandomCapsuleColor } from '@/lib/constants';
import { soundFx } from '@/lib/sound';

interface AddDishPanelProps {
  items: FoodItem[];
  currentUser: Member;
  onAddDish: (name: string, emoji: string, color: string, secondaryColor?: string) => void;
  onRemoveDish: (id: string) => void;
  disabled?: boolean;
}

const COMMON_EMOJIS = ['🍱', '🍜', '🍲', '🥩', '🍗', '🥖', '🥗', '🍕', '🍣', '🧋', '🥟', '🍔', '🌮', '🍛'];

export const AddDishPanel: React.FC<AddDishPanelProps> = ({
  items,
  currentUser,
  onAddDish,
  onRemoveDish,
  disabled = false,
}) => {
  const [customName, setCustomName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍱');

  const handleAddPreset = (preset: (typeof FOOD_PRESETS)[0]) => {
    if (disabled) return;
    soundFx.playPop();
    onAddDish(preset.name, preset.emoji, preset.color, preset.secondaryColor);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !customName.trim()) return;

    const colors = getRandomCapsuleColor();
    soundFx.playPop(600);
    onAddDish(customName.trim(), selectedEmoji, colors.primary, colors.secondary);
    setCustomName('');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Quick Presets Section */}
      <div className="clay-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-orange-950 font-bold text-sm sm:text-base">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Gợi Ý Món Nhanh (1 Chạm Thả Vào Lồng)</span>
          </div>
          <span className="text-[11px] text-orange-700/70 font-semibold hidden sm:inline">
            Bấm để thêm
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {FOOD_PRESETS.map((preset) => {
            const isAlreadyAdded = items.some((i) => i.name.toLowerCase() === preset.name.toLowerCase());

            return (
              <motion.button
                key={preset.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleAddPreset(preset)}
                disabled={disabled}
                type="button"
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border ${
                  isAlreadyAdded
                    ? 'bg-orange-100/60 border-orange-200 text-orange-900 opacity-80'
                    : 'bg-white hover:bg-orange-50 border-orange-200/80 text-orange-950 hover:border-orange-400'
                }`}
              >
                <span className="text-sm">{preset.emoji}</span>
                <span>{preset.name}</span>
                {isAlreadyAdded && <span className="text-[10px] text-orange-500">✓</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom Dish Form */}
      <div className="clay-card p-4 sm:p-5">
        <div className="flex items-center gap-1.5 text-orange-950 font-bold text-sm sm:text-base mb-3">
          <Utensils className="w-4 h-4 text-orange-500" />
          <span>Thêm Món Riêng Của Bạn</span>
        </div>

        <form onSubmit={handleAddCustom} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {/* Emoji Selector */}
            <div className="relative">
              <select
                value={selectedEmoji}
                onChange={(e) => setSelectedEmoji(e.target.value)}
                aria-label="Chọn biểu tượng món ăn"
                className="w-12 h-11 text-xl rounded-xl bg-orange-50 border-2 border-orange-200 text-center cursor-pointer focus:outline-none focus:border-orange-500 font-sans"
              >
                {COMMON_EMOJIS.map((emoji) => (
                  <option key={emoji} value={emoji}>
                    {emoji}
                  </option>
                ))}
              </select>
            </div>

            {/* Dish Name Input */}
            <input
              type="text"
              placeholder="VD: Bún đậu mắm tôm, Cơm rang dưa bò..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={disabled}
              maxLength={40}
              className="flex-1 h-11 px-3.5 rounded-xl bg-orange-50/50 border-2 border-orange-200 focus:bg-white focus:outline-none focus:border-orange-500 text-sm font-semibold text-orange-950 placeholder:text-orange-950/40"
            />

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              type="submit"
              disabled={disabled || !customName.trim()}
              className="h-11 px-4 clay-btn-green rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 text-emerald-950 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Thả Vào</span>
            </motion.button>
          </div>
        </form>
      </div>

      {/* Current Capsule Pool List */}
      <div className="clay-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-orange-950 font-bold text-sm sm:text-base">
            <span>Danh Sách Trong Lồng</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-black">
              {items.length}
            </span>
          </div>
          {items.length > 0 && (
            <span className="text-[11px] text-orange-800/60 font-semibold">
              Bấm vào quả bóng để xem
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-6 text-center text-orange-900/60 text-xs sm:text-sm font-medium">
            Chưa có món nào được thêm. Hãy chọn món gợi ý ở trên nhé! 😋
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/60 border border-orange-200/70 hover:bg-white transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-orange-950 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-orange-700/70 truncate flex items-center gap-1">
                      <span>bởi</span>
                      <span className="font-semibold">{item.avatar} {item.addedBy}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundFx.playPop(400);
                    onRemoveDish(item.id);
                  }}
                  disabled={disabled}
                  type="button"
                  aria-label={`Xóa món ${item.name}`}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                  title="Xóa món này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
