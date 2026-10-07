'use client';

import React, { use, Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { FoodItem, Member, OrderNote, RoomState, BroadcastMessage } from '@/types';
import { RealtimeRoomClient, getStoredRoomState, saveStoredRoomState } from '@/lib/realtime';
import { getRandomAvatar, FOOD_PRESETS } from '@/lib/constants';
import { LotteryMachine } from '@/components/LotteryMachine';
import { AddDishPanel } from '@/components/AddDishPanel';
import { OrderNotesPanel } from '@/components/OrderNotesPanel';
import { RoomHeader } from '@/components/RoomHeader';
import { Sparkles, ExternalLink } from 'lucide-react';


interface PageProps {
  params: Promise<{ id: string }>;
}

function RoomInner({ params }: PageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id.toUpperCase();

  // Current User State
  const [currentUser, setCurrentUser] = useState<Member>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('lunchbox_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {}
      }
    }
    const av = getRandomAvatar();
    return {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      nickname: av.name,
      avatar: av.emoji,
      isHost: false,
      lastActive: Date.now(),
    };
  });

  // Room State
  const [roomState, setRoomState] = useState<RoomState>(() => {
    const cached = getStoredRoomState(roomId);
    if (cached) return cached;

    // Default starter food items if new room
    const defaultStarterPresets = FOOD_PRESETS.slice(0, 5);
    const starterItems: FoodItem[] = defaultStarterPresets.map((preset, idx) => ({
      id: `default_${idx}_${Date.now()}`,
      name: preset.name,
      emoji: preset.emoji,
      color: preset.color,
      secondaryColor: preset.secondaryColor,
      addedBy: 'Hệ Thống',
      avatar: '🍱',
      createdAt: Date.now() - idx * 1000,
    }));

    return {
      roomId,
      roomName: `Phòng Ăn Trưa #${roomId}`,
      hostId: '',
      items: starterItems,
      drawPhase: 'idle',
      winningItem: null,
      notes: [],
      history: [],
    };
  });

  const [members, setMembers] = useState<Member[]>([currentUser]);
  const realtimeClientRef = useRef<RealtimeRoomClient | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveStoredRoomState(roomId, roomState);
  }, [roomId, roomState]);

  // Persist current user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lunchbox_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Setup Realtime BroadcastClient (BroadcastChannel + Supabase fallback)
  useEffect(() => {
    const client = new RealtimeRoomClient(roomId);
    realtimeClientRef.current = client;

    // Check if host
    setRoomState((prev) => {
      const isFirstHost = !prev.hostId;
      if (isFirstHost) {
        setCurrentUser((u) => ({ ...u, isHost: true }));
        return { ...prev, hostId: currentUser.id };
      }
      return prev;
    });

    // Announce join
    client.broadcast('MEMBER_JOIN', currentUser.id, currentUser);

    const unsubscribe = client.subscribe((msg: BroadcastMessage) => {
      if (msg.roomId !== roomId) return;

      switch (msg.type) {
        case 'MEMBER_JOIN': {
          const newMember = msg.payload as Member;
          setMembers((prev) => {
            if (prev.some((m) => m.id === newMember.id)) return prev;
            return [...prev, newMember];
          });
          // Reply with current presence so newcomer gets our info
          if (client && newMember.id !== currentUser.id) {
            client.broadcast('MEMBER_HEARTBEAT', currentUser.id, currentUser);
          }
          break;
        }

        case 'MEMBER_HEARTBEAT': {
          const member = msg.payload as Member;
          setMembers((prev) => {
            if (prev.some((m) => m.id === member.id)) return prev;
            return [...prev, member];
          });
          break;
        }

        case 'ADD_DISH': {
          const newItem = msg.payload as FoodItem;
          setRoomState((prev) => {
            if (prev.items.some((i) => i.id === newItem.id)) return prev;
            return { ...prev, items: [...prev.items, newItem] };
          });
          break;
        }

        case 'REMOVE_DISH': {
          const dishId = msg.payload as string;
          setRoomState((prev) => ({
            ...prev,
            items: prev.items.filter((i) => i.id !== dishId),
          }));
          break;
        }

        case 'START_DRAW': {
          const { winningItem } = msg.payload as { winningItem: FoodItem };
          handleExecuteDrawAnimation(winningItem);
          break;
        }

        case 'RESET_DRAW': {
          setRoomState((prev) => ({
            ...prev,
            drawPhase: 'idle',
            winningItem: null,
          }));
          break;
        }

        case 'ADD_NOTE': {
          const newNote = msg.payload as OrderNote;
          setRoomState((prev) => {
            if (prev.notes.some((n) => n.id === newNote.id)) return prev;
            return { ...prev, notes: [...prev.notes, newNote] };
          });
          break;
        }

        case 'REMOVE_NOTE': {
          const noteId = msg.payload as string;
          setRoomState((prev) => ({
            ...prev,
            notes: prev.notes.filter((n) => n.id !== noteId),
          }));
          break;
        }

        case 'SYNC_STATE': {
          const remoteState = msg.payload as RoomState;
          if (remoteState) {
            setRoomState(remoteState);
          }
          break;
        }

        default:
          break;
      }
    });

    return () => {
      unsubscribe();
      client.cleanup();
    };
  }, [roomId, currentUser.id]);

  // Execute the multi-stage draw sequence smoothly
  const handleExecuteDrawAnimation = useCallback((winningDish: FoodItem) => {
    // Stage 1: Shuffling (4.2 seconds of intense tumbling)
    setRoomState((prev) => ({
      ...prev,
      drawPhase: 'shuffling',
      winningItem: null,
    }));

    // Stage 2: Golden Capsule Drop (1.2 seconds)
    setTimeout(() => {
      setRoomState((prev) => ({
        ...prev,
        drawPhase: 'dropping',
        winningItem: winningDish,
      }));
    }, 4200);

    // Stage 3: Climax Winner Pop & Fireworks
    setTimeout(() => {
      setRoomState((prev) => ({
        ...prev,
        drawPhase: 'winner',
        winningItem: winningDish,
        history: [{ item: winningDish, wonAt: Date.now() }, ...prev.history],
      }));
    }, 5400);
  }, []);

  // Host starts the lottery draw
  const handleStartDraw = () => {
    if (roomState.items.length === 0 || roomState.drawPhase !== 'idle') return;

    // Pick random winner from active items
    const randomIndex = Math.floor(Math.random() * roomState.items.length);
    const winningDish = roomState.items[randomIndex];

    // Broadcast event to all connected peers
    realtimeClientRef.current?.broadcast('START_DRAW', currentUser.id, {
      winningItem: winningDish,
    });

    // Execute local animation
    handleExecuteDrawAnimation(winningDish);
  };

  const handleResetDraw = () => {
    setRoomState((prev) => ({
      ...prev,
      drawPhase: 'idle',
      winningItem: null,
    }));
    realtimeClientRef.current?.broadcast('RESET_DRAW', currentUser.id, {});
  };

  const handleAddDish = (name: string, emoji: string, color: string, secondaryColor?: string) => {
    const newItem: FoodItem = {
      id: 'dish_' + Math.random().toString(36).substring(2, 9),
      name,
      emoji,
      color,
      secondaryColor: secondaryColor || color,
      addedBy: currentUser.nickname,
      avatar: currentUser.avatar,
      createdAt: Date.now(),
    };

    setRoomState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    realtimeClientRef.current?.broadcast('ADD_DISH', currentUser.id, newItem);
  };

  const handleRemoveDish = (id: string) => {
    setRoomState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));

    realtimeClientRef.current?.broadcast('REMOVE_DISH', currentUser.id, id);
  };

  const handleAddNote = (noteText: string) => {
    const newNote: OrderNote = {
      id: 'note_' + Math.random().toString(36).substring(2, 9),
      memberId: currentUser.id,
      memberName: currentUser.nickname,
      avatar: currentUser.avatar,
      note: noteText,
      createdAt: Date.now(),
    };

    setRoomState((prev) => ({
      ...prev,
      notes: [...prev.notes, newNote],
    }));

    realtimeClientRef.current?.broadcast('ADD_NOTE', currentUser.id, newNote);
  };

  const handleRemoveNote = (id: string) => {
    setRoomState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id),
    }));

    realtimeClientRef.current?.broadcast('REMOVE_NOTE', currentUser.id, id);
  };

  const handleUpdateUser = (nickname: string, avatar: string) => {
    const updated = { ...currentUser, nickname, avatar };
    setCurrentUser(updated);
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    realtimeClientRef.current?.broadcast('MEMBER_JOIN', updated.id, updated);
  };

  const isLocked = roomState.drawPhase === 'shuffling' || roomState.drawPhase === 'dropping';

  return (
    <div className="min-h-screen py-4 px-3 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-5">
        {/* Room Header */}
        <RoomHeader
          roomId={roomId}
          roomName={roomState.roomName}
          members={members}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
          isHost={currentUser.isHost}
        />

        {/* Realtime Testing Hint Banner */}
        <div className="w-full p-3 rounded-2xl bg-amber-100/70 border border-amber-300 text-amber-950 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              <strong>Mẹo thử nghiệm Realtime:</strong> Mở thêm tab ẩn danh hoặc tab mới với đường link này để xem bóng nảy, quay số và chốt đơn tự động đồng bộ ngay lập tức!
            </span>
          </div>
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="shrink-0 px-2.5 py-1 rounded-xl bg-white hover:bg-orange-50 border border-amber-300 text-xs font-bold text-orange-900 flex items-center gap-1 shadow-2xs"
            title="Mở thêm 1 tab nữa để test đồng bộ"
          >
            <span>Mở Tab Mới</span>
            <ExternalLink className="w-3 h-3 text-orange-600" />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 3D Lottery Machine & Draw Climax (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full clay-card p-5 sm:p-7 flex flex-col items-center bg-gradient-to-b from-white via-orange-50/20 to-amber-50/40">
              <LotteryMachine
                items={roomState.items}
                drawPhase={roomState.drawPhase}
                winningItem={roomState.winningItem}
                onStartDraw={handleStartDraw}
                onResetDraw={handleResetDraw}
                canStartDraw={!isLocked}
              />
            </div>
          </div>

          {/* Right Column: Adding Dishes & Order Notes Hub (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* If winner has been chosen, show Order Notes prominently at top */}
            {roomState.winningItem && (
              <OrderNotesPanel
                roomId={roomId}
                winningItem={roomState.winningItem}
                notes={roomState.notes}
                currentUser={currentUser}
                onAddNote={handleAddNote}
                onRemoveNote={handleRemoveNote}
              />
            )}

            {/* Food Selection & Pool Controls */}
            <AddDishPanel
              items={roomState.items}
              currentUser={currentUser}
              onAddDish={handleAddDish}
              onRemoveDish={handleRemoveDish}
              disabled={isLocked}
            />

            {/* If no winner yet, also allow taking order notes */}
            {!roomState.winningItem && (
              <OrderNotesPanel
                roomId={roomId}
                winningItem={roomState.winningItem}
                notes={roomState.notes}
                currentUser={currentUser}
                onAddNote={handleAddNote}
                onRemoveNote={handleRemoveNote}
              />
            )}
          </div>
        </div>

        {/* Footer Credit & Mascot */}
        <footer className="mt-8 py-4 text-center text-xs text-orange-900/60 font-semibold flex items-center justify-center gap-1.5">
          <span>LunchBox 3D - Bốc Thăm Trưa Nay Ăn Gì</span>
          <span>•</span>
          <span>Giải quyết phân vân ăn trưa văn phòng trong 3 phút</span>
          <span>🍱✨</span>
        </footer>
      </div>
    </div>
  );
}

export default function RoomPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl animate-bounce mb-3 shadow-md">
            🍱
          </div>
          <p className="font-heading font-black text-xl text-orange-950">
            Đang tải phòng ăn trưa 3D...
          </p>
          <p className="text-xs text-orange-800/70 font-semibold mt-1">
            Chuẩn bị lồng quay Gashapon cho bạn
          </p>
        </div>
      }
    >
      <RoomInner params={params} />
    </Suspense>
  );
}
