import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "LunchBox 3D - Bốc Thăm Trưa Nay Ăn Gì? 🍱 Máy Gashapon Xổ Số Công Sở",
  description:
    "Ứng dụng bốc thăm món ăn trưa công sở phong cách lồng quay xổ số Gashapon 3D cực vui nhộn. Chốt đơn cùng đồng nghiệp trong 3 phút, chia sẻ realtime, copy đơn Zalo 1 chạm!",
  keywords: [
    "trưa nay ăn gì",
    "bốc thăm ăn trưa",
    "gashapon 3d",
    "xổ số món ăn",
    "đặt cơm trưa công sở",
    "quay số ăn trưa",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="min-h-screen antialiased selection:bg-orange-200 selection:text-orange-900">
        {children}
      </body>
    </html>
  );
}
