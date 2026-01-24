"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const API_KEY_STORAGE = 'pollinations_api_key';

export default function Home() {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    // Check for API key from URL hash
    const hash = window.location.hash;
    if (hash.includes('apikey=')) {
      const params = new URLSearchParams(hash.substring(1));
      const key = params.get('apikey');
      if (key) {
        setApiKey(key);
        localStorage.setItem(API_KEY_STORAGE, key);
        window.history.replaceState(null, '', window.location.pathname);
      }
    } else {
      // Load from localStorage
      const savedKey = localStorage.getItem(API_KEY_STORAGE);
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  }, []);

  const handleConnectPollinations = () => {
    const redirectUrl = window.location.href.split('#')[0];
    window.location.href = `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
  };

  const handleDisconnect = () => {
    setApiKey('');
    localStorage.removeItem(API_KEY_STORAGE);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="px-4 py-1.5 rounded-full bg-zinc-900 border border-white/5 backdrop-blur-sm">
              <span className="text-xs sm:text-sm font-medium text-zinc-400">Powered by Pollination API</span>
            </div>
          </div>

          {/* API Key Connect Button */}
          <div className="mb-6">
            {!apiKey ? (
              <button
                onClick={handleConnectPollinations}
                className="px-6 py-2.5 bg-zinc-100 hover:bg-white text-black rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Connect your API key
              </button>
            ) : (
              <div className="inline-flex items-center gap-2">
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  API Connected
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
                  title="Disconnect API"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>
            )}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white tracking-tight leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">ZLKcyber AI</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience the power of next-gen AI with our chat assistant and image generation tools.
            Professional, fast, and aimed for productivity.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            <Link
              href="/chat"
              className="group relative bg-zinc-900/50 p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:bg-zinc-900"
            >
              <div className="relative text-left">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                </div>
                <h2 className="text-xl font-semibold mb-3 text-white">AI Chat</h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Engage in natural conversations with our AI assistant. Get answers, brainstorm ideas, or debug code.
                </p>
                <div className="flex items-center text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Start Chatting <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </div>
              </div>
            </Link>

            <Link
              href="/generate"
              className="group relative bg-zinc-900/50 p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:bg-zinc-900"
            >
              <div className="relative text-left">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" /></svg>
                </div>
                <h2 className="text-xl font-semibold mb-3 text-white">Image Generator</h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Transform your ideas into stunning visuals. Just describe what you want to see.
                </p>
                <div className="flex items-center text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Create Images <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </div>
              </div>
            </Link>

            <Link
              href="/video"
              className="group relative bg-zinc-900/50 p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:bg-zinc-900 sm:col-span-2 lg:col-span-1"
            >
              <div className="relative text-left">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                </div>
                <h2 className="text-xl font-semibold mb-3 text-white">Video Generator</h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Transform your ideas into videos. Just describe what you want to see.
                </p>
                <div className="flex items-center text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Create video <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-white/5 py-16 lg:py-24 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-16 text-white">Why Choose ZLKcyber AI?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:bg-zinc-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </div>
              <h3 className="font-semibold mb-2 text-zinc-200">Lightning Fast</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Responses in seconds</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:bg-zinc-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-white"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
              </div>
              <h3 className="font-semibold mb-2 text-zinc-200">High Quality</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Top-tier AI models</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:bg-zinc-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-white"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
              </div>
              <h3 className="font-semibold mb-2 text-zinc-200">Responsive</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Works everywhere</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:bg-zinc-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-white"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <h3 className="font-semibold mb-2 text-zinc-200">Secure</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Private & safe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-semibold text-white mb-1">
                ZLKcyber AI
              </h3>
              <p className="text-xs text-zinc-500">
                © 2026 ZLKcyber. All rights reserved.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Zlkcyber"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-all text-xs font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </a>

              <a
                href="https://warpcast.com/hendrazk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-all text-xs font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.24.24a2.25 2.25 0 0 1 2.25 2.25v2.247l.003.003v14.51a2.25 2.25 0 0 1-2.25 2.25H5.76A2.25 2.25 0 0 1 3.51 19.25V4.74A2.25 2.25 0 0 1 5.76 2.49h12.48ZM5.76 19.25h12.48V4.74H5.76v14.51Zm9-6.257h1.498v1.498H14.76v-1.498Zm-6 0H10.26v1.498H8.76v-1.498Zm6-3H16.25v1.498H14.76V9.993Zm-6 0H10.26v1.498H8.76V9.993Z" />
                  <path d="M5.76 2.49h12.48a2.25 2.25 0 0 1 2.25 2.25v14.51a2.25 2.25 0 0 1-2.25 2.25H5.76a2.25 2.25 0 0 1-2.25-2.25V4.74a2.25 2.25 0 0 1 2.25-2.25Zm0 2.25v14.51h12.48V4.74H5.76Zm3.75 3.753h4.998V10h-1.5v3h1.5v1.498H9.51V13h1.5v-3h-1.5V8.493Z" />
                </svg>
                <span>Farcaster</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

