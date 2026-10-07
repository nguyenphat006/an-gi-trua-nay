/* Domain model, presets and pure helpers for a lunch room. */

export interface Member {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  lastSeen: number;
}

export interface Dish {
  id: string;
  name: string;
  emoji: string;
  color: string;
  addedById: string;
  addedByName: string;
  createdAt: number;
}

export interface OrderNote {
  id: string;
  memberId: string;
  name: string;
  avatar: string;
  text: string;
  createdAt: number;
}

export type DrawStatus = "idle" | "drawing" | "done";

export interface DrawState {
  status: DrawStatus;
  drawId?: string;
  winner?: Dish;
  /** Local timestamp at which this client started the animation. */
  startedAt?: number;
}

export interface RoomState {
  roomId: string;
  hostId?: string;
  allowAnyoneDraw: boolean;
  dishes: Dish[];
  notes: OrderNote[];
  draw: DrawState;
  /** Ids deleted in this session — prevents stale snapshots resurrecting them. */
  tombstones: string[];
}

export const DRAW_DURATION_MS = 5000;
export const MAX_DISHES = 24;
export const MAX_DISH_NAME = 40;
export const MAX_NOTE = 140;

export const PRESET_DISHES = [
  "Cơm tấm",
  "Bún bò",
  "Phở",
  "Gà rán",
  "Bánh mì",
  "Cơm gà xối mỡ",
  "Healthy salad",
  "Trà sữa",
] as const;

/** Capsule shell colors — saturated but warm so they pop on cream. */
export const CAPSULE_COLORS = [
  "#FF7A30",
  "#FF5A5F",
  "#4ADE80",
  "#38BDF8",
  "#A78BFA",
  "#F472B6",
  "#FACC15",
  "#2DD4BF",
  "#FB923C",
  "#818CF8",
];

const EMOJI_RULES: Array<[RegExp, string]> = [
  [/trà sữa|tra sua|boba|milk ?tea/i, "🧋"],
  [/cà phê|ca phe|coffee/i, "☕"],
  [/salad|healthy|rau|chay/i, "🥗"],
  [/bánh mì|banh mi|sandwich/i, "🥖"],
  [/gà rán|ga ran|fried chicken|kfc|jollibee/i, "🍗"],
  [/pizza/i, "🍕"],
  [/burger|hamburger/i, "🍔"],
  [/sushi|sashimi|nhật|nhat/i, "🍣"],
  [/lẩu|lau|hotpot/i, "🍲"],
  [/nướng|nuong|bbq|thịt|thit|bò|bo bit/i, "🥩"],
  [/phở|pho|bún|bun|mì|mi |miến|hủ tiếu|hu tieu|ramen|noodle/i, "🍜"],
  [/cơm|com|rice|bento/i, "🍱"],
  [/cá|hải sản|hai san|tôm|tom|cua|ốc|oc|seafood/i, "🦐"],
  [/bánh xèo|banh xeo|pancake/i, "🥞"],
  [/dimsum|há cảo|ha cao|xíu mại/i, "🥟"],
  [/taco|mexico/i, "🌮"],
  [/cháo|chao|soup|súp/i, "🥣"],
  [/kem|ice cream|chè|che/i, "🍨"],
  [/xôi|xoi/i, "🍙"],
];

const FALLBACK_EMOJI = ["🍱", "🍛", "🥘", "🍢", "🌯", "🥙", "🍝", "🍤"];

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function emojiForDish(name: string): string {
  for (const [re, emoji] of EMOJI_RULES) if (re.test(name)) return emoji;
  return FALLBACK_EMOJI[hashString(name.toLowerCase()) % FALLBACK_EMOJI.length];
}

export function colorForDish(name: string): string {
  return CAPSULE_COLORS[hashString(name.toLowerCase().trim()) % CAPSULE_COLORS.length];
}

export function normalizeDishName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_DISH_NAME);
}

export function sameDish(a: string, b: string) {
  return a.localeCompare(b, "vi", { sensitivity: "base" }) === 0;
}

export function uid(prefix = ""): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return prefix + rnd;
}

/** Unbiased pick using crypto when available. */
export function randomIndex(n: number): number {
  if (n <= 0) return -1;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    do crypto.getRandomValues(buf);
    while (buf[0] >= limit);
    return buf[0] % n;
  }
  return Math.floor(Math.random() * n);
}

/* ------------------------------------------------------------------ */
/* Room codes                                                          */
/* ------------------------------------------------------------------ */

// No 0/O/1/I/L — easy to read aloud across the office.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[randomIndex(CODE_ALPHABET.length)];
  return code;
}

export function normalizeRoomCode(input: string): string {
  // Accept pasted URLs as well as raw codes.
  const fromUrl = input.match(/room\/([A-Za-z0-9-]+)/);
  const raw = fromUrl ? fromUrl[1] : input;
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function isValidRoomCode(code: string) {
  return /^[A-Z0-9]{6}$/.test(code);
}

/* ------------------------------------------------------------------ */
/* Cute identities                                                     */
/* ------------------------------------------------------------------ */

const ANIMALS: Array<[string, string]> = [
  ["🐱", "Mèo"],
  ["🐼", "Gấu Trúc"],
  ["🦊", "Cáo"],
  ["🐶", "Cún"],
  ["🐰", "Thỏ"],
  ["🐹", "Hamster"],
  ["🐨", "Koala"],
  ["🐯", "Hổ"],
  ["🐸", "Ếch"],
  ["🐧", "Cánh Cụt"],
  ["🦦", "Rái Cá"],
  ["🐻", "Gấu"],
  ["🐷", "Heo"],
  ["🦥", "Lười"],
];

const TRAITS = [
  "Béo Mê Phở",
  "Ăn Chay",
  "Cực Đói",
  "Ghiền Trà Sữa",
  "Săn Deal",
  "Kén Ăn",
  "Ăn Cay Giỏi",
  "Thích Cơm Tấm",
  "Bụng Réo",
  "Mê Gà Rán",
  "Ăn Tất",
  "Healthy",
];

export const AVATAR_CHOICES = ANIMALS.map(([emoji]) => emoji);

export function randomIdentity(): { name: string; avatar: string } {
  const [avatar, animal] = ANIMALS[randomIndex(ANIMALS.length)];
  const trait = TRAITS[randomIndex(TRAITS.length)];
  return { avatar, name: `${animal} ${trait}` };
}

/* ------------------------------------------------------------------ */
/* Ordering helpers                                                    */
/* ------------------------------------------------------------------ */

export function emptyRoom(roomId: string): RoomState {
  return { roomId, allowAnyoneDraw: false, dishes: [], notes: [], draw: { status: "idle" }, tombstones: [] };
}

export function formatOrderSummary(winner: Dish, notes: OrderNote[], roomId: string): string {
  const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const lines = [
    `🍱 CHỐT ĐƠN TRƯA NAY — ${winner.emoji} ${winner.name.toUpperCase()}`,
    `🕐 ${time} · Phòng ${roomId}`,
    "",
  ];
  if (notes.length === 0) {
    lines.push("(Chưa có ai ghi chú món)");
  } else {
    notes
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((n, i) => lines.push(`${i + 1}. ${n.name}: ${n.text}`));
  }
  lines.push("", `Tổng: ${notes.length} phần 🛵`);
  return lines.join("\n");
}

export function foodLinks(dish: string) {
  const q = encodeURIComponent(dish);
  return {
    shopee: `https://shopeefood.vn/search?keyword=${q}`,
    grab: `https://food.grab.com/vn/vi/restaurants?search=${q}`,
    maps: `https://www.google.com/maps/search/${encodeURIComponent(`${dish} gần đây`)}`,
  };
}
