'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Dice5, LogIn, Users, Flame, UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { generateRoomId, FOOD_PRESETS } from '@/lib/constants';
import { soundFx } from '@/lib/sound';

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateRoom = () => {
    soundFx.playPop(700);
    const code = generateRoomId();
    router.push(`/room/${code}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Vui lòng nhập mã phòng!');
      return;
    }
    soundFx.playPop(650);
    router.push(`/room/${cleanCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center py-6 px-4 relative overflow-hidden">
      {/* Background Decorative Floaters */}
      <div className="absolute top-10 left-[8%] pointer-events-none opacity-40 animate-float">
        <span className="text-5xl">🍜</span>
      </div>
      <div className="absolute top-24 right-[10%] pointer-events-none opacity-40 animate-float" style={{ animationDelay: '1.2s' }}>
        <span className="text-5xl">🥩</span>
      </div>
      <div className="absolute bottom-28 left-[12%] pointer-events-none opacity-40 animate-float" style={{ animationDelay: '2s' }}>
        <span className="text-5xl">🍗</span>
      </div>
      <div className="absolute bottom-36 right-[8%] pointer-events-none opacity-40 animate-float" style={{ animationDelay: '0.6s' }}>
        <span className="text-5xl">🧋</span>
      </div>

      {/* Main Hero Container */}
      <main className="w-full max-w-4xl flex flex-col items-center text-center mt-4 sm:mt-8 z-10">
        {/* Top Tag */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100/90 border-2 border-orange-200 text-orange-900 font-extrabold text-xs sm:text-sm shadow-xs mb-5"
        >
          <Sparkles className="w-4 h-4 text-orange-500 animate-spin" />
          <span>Giải Pháp Ăn Trưa Siêu Tốc Cho Dân Văn Phòng</span>
          <span className="text-orange-500">✨</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl text-orange-950 tracking-tight leading-[1.1] max-w-3xl mb-4"
        >
          Trưa Nay Ăn Gì? <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
            Bốc Thăm Xổ Số 3D!
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-orange-900/80 text-base sm:text-lg max-w-xl font-semibold mb-8 leading-relaxed"
        >
          Tạm biệt cảnh hỏi nhau <i>&ldquo;Ăn gì cũng được&rdquo;</i>. Tạo phòng bốc thăm với lồng quay
          Gashapon sống động, chia sẻ đồng nghiệp realtime, chốt đơn Zalo trong 3 phút!
        </motion.p>

        {/* 3D Toy Machine Visual Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative my-4 flex items-center justify-center"
        >
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 gashapon-dome rounded-[50%_50%_46%_46%] flex items-center justify-center shadow-2xl">
            <div className="dome-reflection" />
            <motion.div
              animate={{
                y: [-6, 6, -6],
                rotate: [0, 8, -8, 0],
              }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-6xl sm:text-7xl filter drop-shadow-lg"
            >
              🍱
            </motion.div>

            {/* Orbiting Capsule Badges */}
            <div className="absolute -top-2 -left-2 w-11 h-11 capsule-sphere bg-gradient-to-br from-amber-400 to-orange-500 text-lg shadow-md animate-bounce">
              <div className="capsule-gloss" />
              🍜
            </div>
            <div className="absolute -bottom-2 -right-2 w-11 h-11 capsule-sphere bg-gradient-to-br from-rose-400 to-red-500 text-lg shadow-md animate-bounce" style={{ animationDelay: '0.8s' }}>
              <div className="capsule-gloss" />
              🥩
            </div>
          </div>
        </motion.div>

        {/* Main Action Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-full max-w-md flex flex-col gap-3 mt-4"
        >
          {/* Create Room Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleCreateRoom}
            className="w-full py-4 px-6 clay-btn-primary rounded-2xl text-lg sm:text-xl font-black text-white flex items-center justify-center gap-2 shadow-xl"
          >
            <Dice5 className="w-6 h-6 animate-spin text-amber-200" />
            <span>TẠO PHÒNG ĂN TRƯA NGAY</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Join Room Form */}
          <div className="clay-card p-3 sm:p-4 bg-white/90">
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã phòng (VD: ABC-123)"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value);
                  setErrorMsg('');
                }}
                maxLength={10}
                className="flex-1 h-11 px-3.5 rounded-xl bg-orange-50/60 border-2 border-orange-200 focus:bg-white focus:outline-none focus:border-orange-500 text-sm font-bold text-orange-950 uppercase placeholder:normal-case placeholder:text-orange-950/40"
              />
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                type="submit"
                className="h-11 px-4 clay-btn-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 text-orange-950 shrink-0"
              >
                <LogIn className="w-4 h-4 text-orange-600" />
                <span>Vào Phòng</span>
              </motion.button>
            </form>

            {errorMsg && (
              <p className="text-red-500 text-xs font-bold mt-2 text-left px-1">
                {errorMsg}
              </p>
            )}
          </div>
        </motion.div>

        {/* Popular Dish Preview Marquee Pills */}
        <div className="w-full max-w-2xl mt-8">
          <p className="text-xs font-bold text-orange-900/60 mb-2">
            Món ăn khoái khẩu văn phòng được yêu thích:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {FOOD_PRESETS.slice(0, 8).map((preset) => (
              <span
                key={preset.name}
                className="px-3 py-1 rounded-full bg-white/80 border border-orange-200/80 text-xs font-bold text-orange-900 shadow-2xs flex items-center gap-1"
              >
                <span>{preset.emoji}</span>
                <span>{preset.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left">
          <div className="clay-card p-5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 mb-3 shadow-xs">
              <Dice5 className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-black text-orange-950 text-base mb-1">
              Lồng Quay Xổ Số 3D
            </h3>
            <p className="text-xs text-orange-900/70 font-semibold leading-relaxed">
              Không còn vòng quay nhạt nhẽo. Bóng nảy rung rinh, hiệu ứng âm thanh hồi hộp tột độ và pháo hoa ăn mừng rực rỡ!
            </p>
          </div>

          <div className="clay-card p-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-black text-orange-950 text-base mb-1">
              Đồng Bộ Realtime
            </h3>
            <p className="text-xs text-orange-900/70 font-semibold leading-relaxed">
              Cả nhóm mở link hoặc quét mã QR cùng vào phòng, mỗi người thả 1 món ăn và cùng chứng kiến khoảnh khắc bốc thăm trực tiếp.
            </p>
          </div>

          <div className="clay-card p-5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mb-3 shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-black text-orange-950 text-base mb-1">
              Chốt Đơn Zalo 1 Chạm
            </h3>
            <p className="text-xs text-orange-900/70 font-semibold leading-relaxed">
              Ghi chú khẩu vị từng người, xuất mẫu tin nhắn Zalo/Slack gọn gàng và tự động liên kết nhanh với ShopeeFood / GrabFood!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mt-12 pt-6 border-t border-orange-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-orange-900/60 font-semibold gap-2">
        <div className="flex items-center gap-1.5">
          <span>🍱 LunchBox 3D</span>
          <span>•</span>
          <span>100% Miễn phí & Không cần đăng nhập</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-600 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Realtime Broadcast Ready</span>
        </div>
      </footer>
    </div>
  );
}
