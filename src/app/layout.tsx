import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cordial — AI 칵테일 추천",
  description: "당신의 감정에 맞는 칵테일을 AI가 추천해 드립니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
