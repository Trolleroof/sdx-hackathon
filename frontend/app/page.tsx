'use client';

import ChatConsole from '@/components/ChatConsole';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full bg-zinc-50 font-sans">
      <main className="flex w-full">
        {/* Left: Blank slate (75%) */}
        <section className="w-3/4 min-h-screen border-r border-zinc-200 bg-white p-6">
          <div className="flex h-full min-h-[calc(100vh-3rem)] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white/60 text-zinc-400">
            <div className="text-center space-y-2">
              <span className="text-sm">📊 Chart area will appear here</span>
              <p className="text-xs text-zinc-400">Start chatting to build your strategy</p>
            </div>
          </div>
        </section>

        {/* Right: Chat panel (25%) */}
        <aside className="w-1/4 min-h-screen bg-white">
          <ChatConsole />
        </aside>
      </main>
    </div>
  );
}