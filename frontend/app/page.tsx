'use client';

import { useState } from 'react';
import ChatConsole from '@/components/ChatConsole';
import StockView from '@/components/StockView';
import { getIndicators, getMarketData } from '@/lib/api';

export default function Home() {
  const [ticker, setTicker] = useState<string>('');
  const [market, setMarket] = useState<any | null>(null);
  const [indicators, setIndicators] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleIntent = async (intent: { ticker?: string }) => {
    const t = intent?.ticker?.toUpperCase?.() || '';
    if (!t) return;
    setTicker(t);
    setLoading(true);
    try {
      const [mkt, ind] = await Promise.all([
        getMarketData(t),
        getIndicators(t)
      ]);
      setMarket(mkt);
      setIndicators(ind);
    } catch (e) {
      setIndicators(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 font-sans">
      <main className="flex w-full">
        {/* Left: Data & chart area (75%) */}
        <section className="w-3/4 min-h-screen border-r border-zinc-200 bg-white p-6">
          {ticker ? (
            <StockView ticker={ticker} market={market} indicators={indicators} isLoading={loading} />
          ) : (
            <div className="flex h-full min-h-[calc(100vh-3rem)] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white/60 text-zinc-400">
              <div className="text-center space-y-2">
                <span className="text-sm">📊 Chart area will appear here</span>
                <p className="text-xs text-zinc-400">Start chatting to build your strategy</p>
              </div>
            </div>
          )}
        </section>

        {/* Right: Chat panel (25%) */}
        <aside className="w-1/4 min-h-screen bg-white">
          <ChatConsole onIntent={handleIntent} />
        </aside>
      </main>
    </div>
  );
}