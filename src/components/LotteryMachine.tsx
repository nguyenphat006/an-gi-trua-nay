'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, RotateCcw, Volume2, VolumeX, Flame } from 'lucide-react';
import { FoodItem, DrawPhase } from '@/types';
import { soundFx } from '@/lib/sound';

interface LotteryMachineProps {
  items: FoodItem[];
  drawPhase: DrawPhase;
  winningItem: FoodItem | null;
  onStartDraw: () => void;
  onResetDraw: () => void;
  canStartDraw?: boolean;
}

export const LotteryMachine: React.FC<LotteryMachineProps> = ({
  items,
  drawPhase,
  winningItem,
  onStartDraw,
  onResetDraw,
  canStartDraw = true,
}) => {
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const [crankAngle, setCrankAngle] = useState(0);

  // Trigger audio and confetti effects according to drawPhase
  useEffect(() => {
    let stopRattle: (() => void) | undefined;

    if (drawPhase === 'shuffling') {
      stopRattle = soundFx.startShuffleRattle(4200);
      setCrankAngle((prev) => prev + 720);
    } else if (drawPhase === 'dropping') {
      soundFx.playDrop();
    } else if (drawPhase === 'winner') {
      soundFx.playCapsulePop();
      setTimeout(() => {
        soundFx.playFanfare();
        triggerConfettiExplosion();
      }, 200);
    }

    return () => {
      if (stopRattle) stopRattle();
    };
  }, [drawPhase]);

  const toggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const triggerConfettiExplosion = () => {
    // Multi-stage confetti celebration
    const count = 200;
    const defaults = {
      origin: { y: 0.65 },
      colors: ['#FF7A30', '#FFA45B', '#4ADE80', '#FCD34D', '#FF6584', '#38BDF8'],
    };

    confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.4),
      spread: 60,
      startVelocity: 45,
    });
    confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.35),
      spread: 100,
      decay: 0.91,
      scalar: 1.2,
    });
    confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.25),
      spread: 120,
      startVelocity: 35,
      decay: 0.92,
      scalar: 0.8,
    });
  };

  // Randomized gentle drift coordinates for each ball when idle
  const ballPositions = useMemo(() => {
    return items.map((_, index) => {
      const angle = (index / Math.max(items.length, 1)) * 2 * Math.PI;
      const radius = 25 + (index % 3) * 15;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * (radius * 0.7) + 15,
        rotation: (index * 47) % 360,
      };
    });
  }, [items]);

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center select-none">
      {/* Top Header Floating Badge */}
      <div className="w-full flex items-center justify-between px-3 mb-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-900 text-xs font-bold shadow-xs">
          <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          <span>{items.length} món trong lồng</span>
        </div>

        <button
          onClick={toggleSound}
          type="button"
          className="p-2 rounded-full bg-white/80 hover:bg-white border border-amber-200 text-amber-800 shadow-xs transition-transform active:scale-90"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-orange-500" />}
        </button>
      </div>

      {/* 3D Gashapon Globe Container */}
      <motion.div
        animate={
          drawPhase === 'shuffling'
            ? {
                x: [-3, 3, -4, 4, -2, 2, 0],
                y: [2, -2, 3, -3, 1, -1, 0],
                rotate: [-0.8, 0.8, -1, 1, 0],
              }
            : {}
        }
        transition={
          drawPhase === 'shuffling'
            ? { repeat: Infinity, duration: 0.14, ease: 'linear' }
            : {}
        }
        className="relative w-full aspect-square max-w-[340px] sm:max-w-[380px] flex flex-col items-center"
      >
        {/* Dome Glass Sphere */}
        <div className="relative w-full h-[82%] gashapon-dome rounded-[50%_50%_46%_46%] flex items-center justify-center p-4">
          {/* Curved Specular Reflection Highlights */}
          <div className="dome-reflection" />
          <div className="absolute top-3 right-8 w-10 h-10 rounded-full bg-white/30 blur-[2px] pointer-events-none" />
          <div className="absolute bottom-4 inset-x-6 h-6 rounded-[50%] bg-gradient-to-t from-orange-400/20 to-transparent pointer-events-none" />

          {/* Internal Shuffling Axis / Agitator Center */}
          <motion.div
            animate={{ rotate: drawPhase === 'shuffling' ? 1440 : 0 }}
            transition={{
              duration: drawPhase === 'shuffling' ? 4.5 : 0,
              ease: 'easeInOut',
            }}
            className="absolute z-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-200/40 to-orange-400/30 border border-white/50 backdrop-blur-xs flex items-center justify-center pointer-events-none"
          >
            <div className="w-3 h-3 rounded-full bg-white/80 shadow-xs" />
          </motion.div>

          {/* Empty Dome Placeholder */}
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="z-10 text-center px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-amber-200/60 shadow-xs"
            >
              <span className="text-3xl block mb-1">🍱</span>
              <p className="text-xs font-bold text-amber-900 leading-tight">
                Lồng quay đang trống!
              </p>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                Chọn món bên dưới để thả bóng vào nhé
              </p>
            </motion.div>
          )}

          {/* Bouncing Capsule Balls inside the Dome */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {items.map((item, index) => {
              const pos = ballPositions[index] || { x: 0, y: 0, rotation: 0 };

              // Determine motion states based on drawPhase
              const isShuffling = drawPhase === 'shuffling';

              return (
                <motion.div
                  key={item.id}
                  layoutId={`capsule-${item.id}`}
                  onClick={() => soundFx.playPop(500 + index * 30)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ scale: 0, y: -40, opacity: 0 }}
                  animate={
                    isShuffling
                      ? {
                          x: [
                            pos.x,
                            (Math.random() - 0.5) * 160,
                            (Math.random() - 0.5) * 140,
                            pos.x,
                          ],
                          y: [
                            pos.y,
                            -80 + Math.random() * 120,
                            20 + Math.random() * 80,
                            pos.y,
                          ],
                          rotate: [pos.rotation, pos.rotation + 360, pos.rotation + 720],
                          scale: [1, 1.15, 0.9, 1],
                        }
                      : {
                          x: pos.x,
                          y: [pos.y - 4, pos.y + 4, pos.y - 4],
                          rotate: pos.rotation,
                          scale: 1,
                          opacity: 1,
                        }
                  }
                  transition={
                    isShuffling
                      ? {
                          repeat: Infinity,
                          duration: 0.35 + (index % 4) * 0.05,
                          ease: 'easeInOut',
                        }
                      : {
                          y: {
                            repeat: Infinity,
                            duration: 2.2 + (index % 3) * 0.4,
                            ease: 'easeInOut',
                          },
                          layout: { duration: 0.3 },
                        }
                  }
                  className="absolute cursor-pointer w-12 h-12 sm:w-14 sm:h-14 capsule-sphere group"
                  style={{
                    background: `linear-gradient(145deg, #ffffff 35%, ${item.color} 36%, ${item.secondaryColor || item.color} 100%)`,
                  }}
                  title={`${item.name} (do ${item.addedBy} thêm)`}
                >
                  {/* Gloss highlight */}
                  <div className="capsule-gloss" />
                  <div className="capsule-seam" />

                  {/* Food Emoji inside capsule */}
                  <span className="text-xl sm:text-2xl filter drop-shadow-xs transition-transform group-hover:scale-125">
                    {item.emoji}
                  </span>

                  {/* Hover tooltip for name */}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none z-30 shadow-md">
                    {item.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Machine Base (Tactile Clay Stand with Prize Chute & Crank) */}
        <div className="w-[94%] h-[24%] -mt-3 gashapon-base flex items-center justify-between px-5 relative z-20">
          {/* Brand/Decal Ribbon */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-100 text-orange-950 font-black text-[11px] tracking-wider uppercase px-4 py-0.5 rounded-full border-2 border-orange-300 shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>LUNCHBOX 3D</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>

          {/* Left Decorative Gauge */}
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-amber-950/20 border-2 border-amber-200/50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-[9px] font-bold text-amber-100 mt-0.5">READY</span>
          </div>

          {/* Center Prize Chute Opening */}
          <div className="relative w-24 h-16 chute-opening flex items-center justify-center overflow-visible">
            {/* Chute interior glow */}
            <div className="absolute inset-0 bg-radial from-amber-500/20 to-transparent pointer-events-none" />

            {/* Dropping Golden Capsule Animation */}
            <AnimatePresence>
              {(drawPhase === 'dropping' || drawPhase === 'revealing') && winningItem && (
                <motion.div
                  initial={{ y: -50, scale: 0.5, rotate: 0 }}
                  animate={{ y: 0, scale: 1.1, rotate: 360 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="w-13 h-13 capsule-sphere shadow-xl z-30"
                  style={{
                    background: `linear-gradient(145deg, #ffffff 35%, #F59E0B 36%, #D97706 100%)`,
                  }}
                >
                  <div className="capsule-gloss" />
                  <div className="capsule-seam" />
                  <span className="text-2xl animate-spin">✨</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right 3D Rotating Crank Knob */}
          <div className="flex flex-col items-center">
            <motion.button
              type="button"
              animate={{ rotate: crankAngle }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              onClick={() => {
                if (canStartDraw && drawPhase === 'idle' && items.length > 0) {
                  onStartDraw();
                } else {
                  soundFx.playClick();
                  setCrankAngle((prev) => prev + 180);
                }
              }}
              disabled={drawPhase === 'shuffling' || drawPhase === 'dropping'}
              className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-100 to-amber-300 border-3 border-amber-50 shadow-md flex items-center justify-center active:scale-95 transition-transform"
              title="Vặn trục xoay"
            >
              <div className="w-3.5 h-7 bg-gradient-to-r from-orange-500 to-amber-600 rounded-sm shadow-inner" />
            </motion.button>
            <span className="text-[9px] font-bold text-amber-100 mt-0.5">XOAY</span>
          </div>
        </div>
      </motion.div>

      {/* Main Action Buttons */}
      <div className="mt-4 w-full flex flex-col items-center gap-2">
        {drawPhase === 'idle' && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartDraw}
            disabled={!canStartDraw || items.length === 0}
            className={`w-full max-w-sm py-4 px-6 text-lg sm:text-xl font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all ${
              items.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'clay-btn-primary animate-glow text-white'
            }`}
          >
            <span>🎰</span>
            <span>BẮT ĐẦU XỔ SỐ NGAY!</span>
            <span>✨</span>
          </motion.button>
        )}

        {drawPhase === 'shuffling' && (
          <div className="w-full max-w-sm py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-white font-black text-center text-lg shadow-xl animate-pulse flex items-center justify-center gap-2">
            <span className="animate-spin text-2xl">🌀</span>
            <span>ĐANG QUAY SỐ HỒI HỘP...</span>
          </div>
        )}

        {drawPhase === 'dropping' && (
          <div className="w-full max-w-sm py-4 px-6 rounded-2xl bg-amber-500 text-white font-black text-center text-lg shadow-xl flex items-center justify-center gap-2">
            <span>✨</span>
            <span>BÓNG VÀNG ĐANG LĂN RA...</span>
          </div>
        )}

        {drawPhase === 'winner' && (
          <div className="w-full max-w-sm flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={onResetDraw}
              className="flex-1 py-3.5 px-4 clay-btn-white rounded-2xl font-bold flex items-center justify-center gap-1.5 text-orange-950"
            >
              <RotateCcw className="w-4 h-4 text-orange-600" />
              <span>Quay Lại Lần Nữa</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* CLIMAX POPPED-OPEN PRIZE CARD OVERLAY */}
      <AnimatePresence>
        {drawPhase === 'winner' && winningItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 15, stiffness: 220 }}
            className="mt-6 w-full max-w-md clay-card p-6 border-3 border-amber-300 bg-gradient-to-b from-amber-50 via-white to-orange-50/50 shadow-2xl relative overflow-hidden"
          >
            {/* Background radiant beams */}
            <div className="absolute inset-0 bg-radial from-amber-300/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Golden Trophy Crown Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider shadow-sm mb-3">
                <Trophy className="w-3.5 h-3.5 text-amber-950" />
                <span>MÓN ĂN CHIẾN THẮNG TRƯA NAY!</span>
              </div>

              {/* Popped Capsule halves & food visual */}
              <div className="relative my-2 flex items-center justify-center">
                <motion.div
                  initial={{ rotate: -20, x: -20 }}
                  animate={{ rotate: -35, x: -35 }}
                  transition={{ type: 'spring' }}
                  className="w-12 h-12 rounded-t-full bg-gradient-to-b from-amber-300 to-amber-500 border border-white/60 shadow-md opacity-75"
                />

                <motion.div
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                  className="z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-xl border-3 border-amber-300 flex items-center justify-center mx-[-15px]"
                >
                  <span className="text-5xl sm:text-6xl filter drop-shadow-md">
                    {winningItem.emoji}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ rotate: 20, x: 20 }}
                  animate={{ rotate: 35, x: 35 }}
                  transition={{ type: 'spring' }}
                  className="w-12 h-12 rounded-b-full bg-gradient-to-b from-orange-400 to-orange-600 border border-white/60 shadow-md opacity-75"
                />
              </div>

              {/* Winning Dish Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-orange-950 mt-2 font-heading tracking-tight">
                {winningItem.name}
              </h2>

              <p className="text-xs text-orange-700/80 mt-1 font-semibold flex items-center gap-1">
                <span>Gợi ý bởi</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 font-bold">
                  {winningItem.avatar} {winningItem.addedBy}
                </span>
              </p>

              {/* Deep Link Delivery Buttons */}
              <div className="w-full mt-5 pt-4 border-t border-amber-200/60 flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-600 text-left">
                  🚀 Đặt nhanh món này trên ứng dụng:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`https://shopeefood.vn/search?keyword=${encodeURIComponent(winningItem.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs transition-colors shadow-xs active:scale-95"
                  >
                    <span className="text-base mb-0.5">🛵</span>
                    <span className="leading-tight">ShopeeFood</span>
                  </a>

                  <a
                    href={`https://food.grab.com/vn/vi/restaurants?search=${encodeURIComponent(winningItem.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition-colors shadow-xs active:scale-95"
                  >
                    <span className="text-base mb-0.5">🟢</span>
                    <span className="leading-tight">GrabFood</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(winningItem.name)}+gần+đây`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs transition-colors shadow-xs active:scale-95"
                  >
                    <span className="text-base mb-0.5">📍</span>
                    <span className="leading-tight">Quán gần đây</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
