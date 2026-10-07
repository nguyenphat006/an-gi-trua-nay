'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  Check,
  QrCode,
  Users,
  Edit3,
  X,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Member } from '@/types';
import { CUTE_AVATARS } from '@/lib/constants';
import { soundFx } from '@/lib/sound';

interface RoomHeaderProps {
  roomId: string;
  roomName: string;
  members: Member[];
  currentUser: Member;
  onUpdateUser: (nickname: string, avatar: string) => void;
  isHost: boolean;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomId,
  members,
  currentUser,
  onUpdateUser,
  isHost,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());

  // Edit profile state
  const [nicknameInput, setNicknameInput] = useState(currentUser.nickname);
  const [avatarSelected, setAvatarSelected] = useState(currentUser.avatar);

  const roomUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyRoomCode = async () => {
    soundFx.playPop(700);
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const copyRoomLink = async () => {
    soundFx.playPop(700);
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    soundFx.playPop();
    onUpdateUser(nicknameInput.trim(), avatarSelected);
    setShowProfile(false);
  };

  const toggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="w-full flex flex-col gap-3 py-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Logo and Back */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-orange-100 hover:bg-orange-200 border border-orange-200 flex items-center justify-center text-orange-800 transition-colors shadow-2xs"
            title="Về trang chủ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🍱</span>
              <h1 className="font-heading font-black text-orange-950 text-lg sm:text-xl leading-tight">
                LunchBox 3D
              </h1>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
              <Radio className="w-3 h-3 animate-pulse text-emerald-500" />
              <span>BroadcastChannel Sync (Đồng bộ Realtime)</span>
            </div>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Mute Button */}
          <button
            onClick={toggleSound}
            type="button"
            className="p-2 rounded-xl bg-white/90 hover:bg-white border border-amber-200 text-amber-900 shadow-2xs transition-transform active:scale-90"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-orange-500" />
            )}
          </button>

          {/* User Profile Avatar Pill */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setNicknameInput(currentUser.nickname);
              setAvatarSelected(currentUser.avatar);
              setShowProfile(true);
            }}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-orange-50 border border-orange-200 shadow-2xs text-xs font-bold text-orange-950 transition-colors"
          >
            <span className="text-base">{currentUser.avatar}</span>
            <span className="max-w-[85px] sm:max-w-[120px] truncate">
              {currentUser.nickname}
            </span>
            {isHost && (
              <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[9px] font-black">
                HOST
              </span>
            )}
            <Edit3 className="w-3 h-3 text-orange-400" />
          </motion.button>
        </div>
      </div>

      {/* Room Details Bar: Code, Share, QR, Live Presence */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/70 backdrop-blur-xs border border-orange-200/80 shadow-xs">
        {/* Room Code Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-orange-900/70">Mã phòng:</span>
          <button
            onClick={copyRoomCode}
            type="button"
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-mono font-black text-sm tracking-widest shadow-xs flex items-center gap-1.5 active:scale-95 transition-transform"
            title="Bấm để copy mã phòng"
          >
            <span>{roomId}</span>
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* QR Code trigger */}
          <button
            onClick={() => setShowQR(true)}
            type="button"
            className="p-1.5 rounded-xl bg-orange-100/70 hover:bg-orange-100 text-orange-800 transition-colors shadow-2xs"
            title="Hiển thị mã QR mời bạn bè"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        {/* Live Members Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-orange-900/80">
            <Users className="w-3.5 h-3.5 text-orange-500" />
            <span>{members.length} người đang có mặt</span>
          </div>

          <div className="flex -space-x-2 overflow-hidden">
            {members.slice(0, 5).map((m) => (
              <div
                key={m.id}
                title={`${m.avatar} ${m.nickname}${m.isHost ? ' (Host)' : ''}`}
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-orange-100 flex items-center justify-center text-sm shadow-2xs"
              >
                {m.avatar}
              </div>
            ))}
            {members.length > 5 && (
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-orange-500 text-white font-black text-[10px] flex items-center justify-center">
                +{members.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm clay-card p-6 bg-white relative flex flex-col items-center text-center"
            >
              <button
                onClick={() => setShowQR(false)}
                type="button"
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>

              <span className="text-3xl mb-1">📱</span>
              <h3 className="font-heading font-black text-orange-950 text-xl">
                Quét QR Vào Phòng
              </h3>
              <p className="text-xs text-orange-800/70 font-semibold mb-4">
                Đồng nghiệp mở camera quét là vào ngay, không cần đăng nhập!
              </p>

              <div className="p-3 bg-white rounded-2xl border-2 border-orange-200 shadow-inner mb-4">
                <QRCodeSVG value={roomUrl} size={180} level="M" />
              </div>

              <p className="font-mono text-sm font-bold text-orange-900 mb-3 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                Mã: {roomId}
              </p>

              <button
                onClick={copyRoomLink}
                type="button"
                className="w-full py-2.5 clay-btn-primary rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Đã sao chép link!' : 'Sao chép link mời'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm clay-card p-6 bg-white relative flex flex-col"
            >
              <button
                onClick={() => setShowProfile(false)}
                type="button"
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <h3 className="font-heading font-black text-orange-950 text-lg">
                  Đổi Biệt Danh & Linh Vật
                </h3>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                {/* Avatar selection grid */}
                <div>
                  <label className="text-xs font-bold text-orange-900 mb-2 block">
                    Chọn linh vật may mắn của bạn:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {CUTE_AVATARS.map((av) => (
                      <button
                        key={av.name}
                        type="button"
                        onClick={() => {
                          setAvatarSelected(av.emoji);
                          soundFx.playPop();
                        }}
                        className={`h-11 rounded-xl text-2xl flex items-center justify-center transition-all ${
                          avatarSelected === av.emoji
                            ? 'bg-orange-200 border-2 border-orange-500 scale-105 shadow-xs'
                            : 'bg-orange-50/60 border border-orange-200/80 hover:bg-orange-100'
                        }`}
                      >
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nickname input */}
                <div>
                  <label className="text-xs font-bold text-orange-900 mb-1.5 block">
                    Biệt danh của bạn:
                  </label>
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    maxLength={25}
                    placeholder="VD: Mèo Béo Mê Phở..."
                    className="w-full h-11 px-3 rounded-xl bg-orange-50/50 border-2 border-orange-200 focus:bg-white focus:outline-none focus:border-orange-500 text-sm font-bold text-orange-950"
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowProfile(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 clay-btn-primary rounded-xl text-xs font-bold text-white"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
