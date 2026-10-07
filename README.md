# LunchBox 3D – Bốc Thăm Trưa Nay Ăn Gì 🎰

Collaborative gashapon lottery that picks the team's lunch.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Realtime drivers

| Driver | When | How |
| --- | --- | --- |
| `broadcast` (default) | Local testing | Native `BroadcastChannel`. Open the room in several tabs, or use the **"+ Mở tab mới"** button. Each tab acts as a different teammate. |
| `supabase` | Real rooms across devices | Copy `.env.example` → `.env.local`, set `NEXT_PUBLIC_REALTIME_DRIVER=supabase` and the Supabase URL/anon key. No tables needed: it only uses Realtime Broadcast. |

Both drivers implement the same `RoomTransport` interface (`lib/realtime/`), so the room logic is identical.

## Layout

- `lib/sound.ts`: Web Audio synth (pop, clack, drumroll, fanfare…)
- `lib/room.ts`: domain types, presets, emoji/color mapping, order summary, deep links
- `lib/realtime/*`: BroadcastChannel and Supabase transports
- `hooks/useLunchRoom.ts`: event reducer, presence heartbeats, snapshot sync for late joiners
- `components/LotteryMachine.tsx`: rAF capsule physics, CSS-3D cage, drop → roll → pop reveal
- `app/room/[id]/page.tsx`: the live room
