import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AnimeProvider } from "@/hooks/useAnimeData";

export const metadata: Metadata = {
  title: "Anime Manager",
  description: "ハイブリッドアニメ管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body style={{ display: 'flex', minHeight: '100vh' }}>
        <AnimeProvider>
          <Sidebar />
          <main style={{ marginLeft: '160px', flex: 1, minHeight: '100vh', background: '#000' }}>
            {children}
          </main>
        </AnimeProvider>
      </body>
    </html>
  );
}
