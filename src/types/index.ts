export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  color: string; // color theme or gradient
  secondaryColor?: string;
  addedBy: string;
  avatar: string;
  createdAt: number;
}

export interface Member {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  lastActive: number;
}

export interface OrderNote {
  id: string;
  memberId: string;
  memberName: string;
  avatar: string;
  note: string;
  createdAt: number;
}

export type DrawPhase = 'idle' | 'shuffling' | 'dropping' | 'revealing' | 'winner';

export interface RoomState {
  roomId: string;
  roomName: string;
  hostId: string;
  items: FoodItem[];
  drawPhase: DrawPhase;
  winningItem: FoodItem | null;
  drawStartedAt?: number;
  notes: OrderNote[];
  history: {
    item: FoodItem;
    wonAt: number;
  }[];
}

export type RealtimeActionType =
  | 'SYNC_STATE'
  | 'ADD_DISH'
  | 'REMOVE_DISH'
  | 'START_DRAW'
  | 'REVEAL_WINNER'
  | 'RESET_DRAW'
  | 'ADD_NOTE'
  | 'REMOVE_NOTE'
  | 'MEMBER_JOIN'
  | 'MEMBER_HEARTBEAT';

export interface BroadcastMessage<T = unknown> {
  type: RealtimeActionType;
  roomId: string;
  senderId: string;
  payload: T;
  timestamp: number;
}
