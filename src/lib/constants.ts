export interface FoodPreset {
  name: string;
  emoji: string;
  color: string;
  secondaryColor: string;
}

export const FOOD_PRESETS: FoodPreset[] = [
  { name: 'Cơm tấm sườn bì', emoji: '🥩', color: '#FF7A30', secondaryColor: '#FFB082' },
  { name: 'Bún bò Huế', emoji: '🍜', color: '#E11D48', secondaryColor: '#FDA4AF' },
  { name: 'Phở bò tái lăn', emoji: '🍲', color: '#059669', secondaryColor: '#6EE7B7' },
  { name: 'Gà rán giòn cay', emoji: '🍗', color: '#EA580C', secondaryColor: '#FDBA74' },
  { name: 'Bánh mì thập cẩm', emoji: '🥖', color: '#D97706', secondaryColor: '#FCD34D' },
  { name: 'Cơm gà xối mỡ', emoji: '🍚', color: '#F59E0B', secondaryColor: '#FEF08A' },
  { name: 'Healthy Salad', emoji: '🥗', color: '#16A34A', secondaryColor: '#86EFAC' },
  { name: 'Trà sữa trân châu', emoji: '🧋', color: '#9333EA', secondaryColor: '#D8B4FE' },
  { name: 'Bún chả Hà Nội', emoji: '🍢', color: '#DC2626', secondaryColor: '#FCA5A5' },
  { name: 'Pizza phô mai', emoji: '🍕', color: '#E11D48', secondaryColor: '#FDE047' },
  { name: 'Bánh cuốn nóng', emoji: '🥟', color: '#0284C7', secondaryColor: '#7DD3FC' },
  { name: 'Sushi & Sashimi', emoji: '🍣', color: '#BE185D', secondaryColor: '#F472B6' },
];

export const CUTE_AVATARS = [
  { emoji: '🐱', name: 'Mèo Béo Mê Phở' },
  { emoji: '🐼', name: 'Gấu Trúc Ăn Chay' },
  { emoji: '🦊', name: 'Cáo Cực Đói' },
  { emoji: '🐶', name: 'Cún Con Thèm Cơm' },
  { emoji: '🐰', name: 'Thỏ Trắng Uống Trà' },
  { emoji: '🐻', name: 'Gấu Nâu Mê Gà Rán' },
  { emoji: '🐹', name: 'Hamster Gặm Bánh' },
  { emoji: '🐯', name: 'Hổ Con Thích Thịt' },
  { emoji: '🐧', name: 'Cánh Cụt Thèm Kem' },
  { emoji: '🐨', name: 'Koala Buồn Ngủ' },
];

export const CAPSULE_COLORS = [
  { primary: '#FF7A30', secondary: '#FFB082' },
  { primary: '#F43F5E', secondary: '#FDA4AF' },
  { primary: '#10B981', secondary: '#A7F3D0' },
  { primary: '#3B82F6', secondary: '#BFDBFE' },
  { primary: '#8B5CF6', secondary: '#DDD6FE' },
  { primary: '#F59E0B', secondary: '#FDE68A' },
  { primary: '#EC4899', secondary: '#FBCFE8' },
  { primary: '#06B6D4', secondary: '#A5F3FC' },
];

export function getRandomAvatar() {
  const index = Math.floor(Math.random() * CUTE_AVATARS.length);
  return CUTE_AVATARS[index];
}

export function getRandomCapsuleColor() {
  const index = Math.floor(Math.random() * CAPSULE_COLORS.length);
  return CAPSULE_COLORS[index];
}

export function generateRoomId(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  code += '-';
  for (let i = 0; i < 3; i++) {
    code += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return code;
}
