import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import FarcasterProvider from "@/app/components/FarcasterProvider";
import { ConfirmProvider } from "@/app/components/ConfirmModal";
import Image from 'next/image';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZLKcyber AI",
  description: "AI-powered chat and image generation using ZLKcyber AI",
  openGraph: {
    title: "ZLKcyber AI",
    description: "AI-powered chat and image generation",
    url: "https://zlkcyber.tech",
    siteName: "ZLKcyber AI",
    images: [
      {
        url: "https://zlkcyber.tech/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "ZLKcyber AI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://zlkcyber.tech/opengraph-image.png",
      button: {
        title: "Launch ZLKcyber AI",
        action: {
          type: "launch_frame",
          name: "ZLKcyber AI",
          url: "https://zlkcyber.tech",
          splashImageUrl: "https://zlkcyber.tech/opengraph-image.png",
          splashBackgroundColor: "#0f172a"
        }
      }
    }),
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`}
      >
        <nav className="bg-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="group">
                  <span className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight group-hover:text-blue-400 transition-colors duration-300">
                    ZLKcyber AI
                  </span>
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-1">
                <Link
                  href="/chat"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                  <span className="hidden sm:inline">Chat</span>
                </Link>

                <Link
                  href="/generate"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" /></svg>
                  <span className="hidden sm:inline">Generate</span>
                </Link>

                <Link
                  href="/video"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><polyline points="7 7 12 12 7 17" /></svg>
                  <span className="hidden sm:inline">Video</span>
                </Link>

                <Link
                  href="/gallery"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                  <span className="hidden sm:inline">Gallery</span>
                </Link>

                <Link
                  href="/edit"
                  className="flex items-center gap-2 px-3 py-2 ml-2 text-xs font-medium text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
                  <span className="hidden sm:inline">Edit</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <FarcasterProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </FarcasterProvider>
      </body>
    </html>
  );
}
