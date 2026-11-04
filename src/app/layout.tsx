import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AudioPlayer from '@/components/AudioPlayer';

import { AudioPlayerProvider } from '@/app/context/AudioPlayerContext';
import AuthProvider from "@/app/context/AuthProvider";
import AuthGuard from "@/components/AuthGuard";
import SessionHeartbeat from "@/components/SessionHeartbeat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlueStreams",
  description: "Your personal movies, TV and music library.",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AudioPlayerProvider>
          <AuthProvider>
            <SessionHeartbeat />

            <div className="flex h-screen flex-col">
              <AuthGuard>
                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>

                <AudioPlayer />
              </AuthGuard>
            </div>
          </AuthProvider>
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
