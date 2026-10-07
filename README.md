# 🍱 LunchBox 3D - Bốc Thăm Trưa Nay Ăn Gì?

Ứng dụng web sáng tạo, vui nhộn và tương tác cao giúp giải quyết bài toán muôn thuở của giới văn phòng: **"Trưa nay ăn gì?"** chỉ trong vòng 3 phút bằng **Lồng quay xổ số Gashapon 3D**, xoá bỏ hoàn toàn các vòng quay may mắn bánh xe nhàm chán hay biểu mẫu bình chọn tẻ nhạt.

---

## 🎨 Thiết Kế & Trải Nghiệm (Claymorphism & Kawaii 3D)
- **Vibe:** Soft, playful, toy-like, tactile, thân thiện và ấm áp.
- **Bảng màu:**
  - 🥭 Mango Orange (`#FF7A30`) & Peach Blossom (`#FFA45B`)
  - 🥗 Celery Green (`#4ADE80`)
  - 🍮 Buttercream Custard (`#FFFDF5` / `#FDF6E9`)
- **Hiệu ứng vật lý & Micro-interactions:**
  - Lồng kính Gashapon 3D với góc bo tròn, bóng phản quang và các quả bóng capsule nhấp nhô sống động.
  - Tương tác squash & stretch khi nhấn nút (`whileTap={{ scale: 0.94 }}`).
  - Bốc thăm hồi hộp 5 giây với hiệu ứng rung lắc màn hình và tiếng máy quay xổ số dồn dập.
  - Pháo hoa giấy đa hướng mừng chiến thắng (`canvas-confetti`).

---

## 🎲 Cơ Chế Hoạt Động (Gashapon Lottery Draw)
1. **Thả Món Ăn (Pool Entry):**
   - Chọn nhanh các món quốc dân: *Cơm tấm, Bún bò Huế, Phở bò, Gà rán, Bánh mì, Salad, Trà sữa...* bằng 1 cú chạm.
   - Hoặc tự gõ món riêng kèm emoji yêu thích.
   - Món ăn ngay lập tức biến thành quả cầu capsule 3D lăn vào lồng quay.
2. **Khoảnh Khắc Bốc Thăm (The Draw):**
   - Bấm **"BẮT ĐẦU XỔ SỐ! 🎰"** ➔ Sự kiện phát sóng đồng bộ tới tất cả thành viên trong phòng.
   - Các quả bóng đảo lộn cuồng nhiệt trong lồng kính.
   - Quả cầu vàng phát sáng lăn xuống khe trúng thưởng ➔ Tách vỏ tung bùng nổ pháo hoa!
3. **Trung Tâm Chốt Đơn (Post-Draw Hub):**
   - Vinh danh món chiến thắng trên thẻ cúp vàng 3D.
   - Mỗi người ghi chú khẩu vị riêng (VD: *Nam: Cơm sườn bì nhiều ớt*, *Linh: Ít cơm không mỡ hành*).
   - **Copy 1 chạm:** Tự động định dạng tin nhắn đẹp mắt để dán ngay vào group chat Zalo / Slack.
   - **Liên kết 1 chạm:** Mở thẳng kết quả tìm kiếm trên ShopeeFood, GrabFood hoặc Google Maps quán gần đây.

---

## ⚡ Đồng Bộ Realtime (Broadcast Channel & Supabase)
Ứng dụng hỗ trợ cơ chế phát sóng kép cực kỳ linh hoạt:
- **Test nhanh qua Native `BroadcastChannel`:** Mở nhiều tab hoặc cửa sổ trình duyệt cùng lúc trên cùng máy tính (`/room/LUNCH-88`) để trải nghiệm đồng bộ hai chiều tức thì mà **không cần cấu hình Supabase**.
- **Supabase Realtime:** Thiết lập `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong file `.env.local` để đồng bộ giữa nhiều máy tính và điện thoại di động qua internet.

---

## 🔊 Âm Thanh Tổng Hợp Web Audio API
- Không cần tải file mp3 bên ngoài, không lo lỗi 404 hay tốn băng thông:
  - `playPop()`: Âm thanh bong bóng nảy vui nhộn khi thêm món hoặc chạm bóng.
  - `playTick()` / `startShuffleRattle()`: Tiếng va chạm lách cách và trống dồn dập khi lồng quay hoạt động.
  - `playDrop()` & `playCapsulePop()`: Tiếng bóng vàng lăn và vỏ capsule tách mở.
  - `playFanfare()`: Hợp âm kèn mừng chiến thắng rộn rã.

---

## 🚀 Hướng Dẫn Chạy Cục Bộ

1. Cài đặt các gói phụ thuộc:
```bash
npm install
```

2. Khởi chạy máy chủ phát triển:
```bash
npm run dev
```

3. Mở trình duyệt tại: `http://localhost:3000` (hoặc cổng hiển thị trong terminal)
