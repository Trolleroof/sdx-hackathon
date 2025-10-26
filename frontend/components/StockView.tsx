import React from 'react';

interface StockViewProps {
  ticker: string;
  market?: {
    ticker: string;
    current_price: number;
    volatility?: number;
    expiry?: string;
    all_expiries?: string[];
    last_updated?: string;
    source?: string;
  } | null;
  indicators?: Record<string, any> | null;
  isLoading?: boolean;
}

interface ParsedIndicator {
  name: string;
  fullName: string;
  value: number;
  value2?: number;
  lastRefreshed: string;
}

function parseIndicators(indicators: Record<string, any>): ParsedIndicator[] {
  const parsed: ParsedIndicator[] = [];
  
  for (const [key, data] of Object.entries(indicators)) {
    if (data?.error) continue;
    
    try {
      const meta = data['Meta Data'] || {};
      const techKey = Object.keys(data).find(k => k.includes('Technical Analysis'));
      if (!techKey) continue;
      
      const techData = data[techKey];
      const dates = Object.keys(techData).sort().reverse();
      if (dates.length === 0) continue;
      
      const latest = techData[dates[0]];
      const indicatorName = meta['2: Indicator'] || key;
      
      const values = Object.values(latest).map(v => parseFloat(String(v))).filter(v => !isNaN(v));
      
      parsed.push({
        name: key,
        fullName: indicatorName,
        value: values[0],
        value2: values[1],
        lastRefreshed: meta['3: Last Refreshed'] || dates[0]
      });
    } catch (e) {
      // Skip parsing errors
    }
  }
  
  return parsed;
}

export default function StockView({ ticker, market, indicators, isLoading }: StockViewProps) {
  if (!ticker) return null;
  
  const parsedIndicators = indicators ? parseIndicators(indicators) : [];
  
  // Sort indicators by priority/trading value and take top 5
  const topIndicators = parsedIndicators
    .sort((a, b) => {
      // Prioritize BBANDS, AROON, SAR, ULTOSC, ROC for trading decisions
      const priority: Record<string, number> = { bbands: 10, aroon: 9, sar: 8, ultosc: 7, roc: 6, mom: 5, cmo: 4, tema: 3, dema: 2, wma: 1 };
      return (priority[b.name.toLowerCase()] || 0) - (priority[a.name.toLowerCase()] || 0);
    })
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Market Snapshot */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">{ticker} Snapshot</h3>
          {isLoading ? (
            <span className="text-xs text-zinc-500">Loading…</span>
          ) : (
            <span className="text-xs text-zinc-400">{market?.source || 'alpha_vantage'}</span>
          )}
        </div>
        {market ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-zinc-500">Price</div>
              <div className="font-medium text-zinc-900">${market.current_price?.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-zinc-500">Volatility</div>
              <div className="font-medium text-zinc-900">{market.volatility ? (market.volatility * 100).toFixed(1) + '%' : '—'}</div>
            </div>
            <div>
              <div className="text-zinc-500">Primary Expiry</div>
              <div className="font-medium text-zinc-900">{market.expiry || '—'}</div>
            </div>
            <div>
              <div className="text-zinc-500">Updated</div>
              <div className="font-medium text-zinc-900">{market.last_updated ? new Date(market.last_updated).toLocaleString() : '—'}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">No snapshot available.</div>
        )}
      </div>

      {/* Top 5 Indicators */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-zinc-900">Top Indicators</h4>
        {topIndicators.length === 0 ? (
          <div className="text-sm text-zinc-500">No indicators loaded.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {topIndicators.map((ind, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-600">
                      {ind.name}
                    </div>
                    <div className="text-xs text-zinc-500">{ind.fullName}</div>
                  </div>
                  <div className="text-right">
                    {ind.value2 !== undefined ? (
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{ind.value.toFixed(2)}</div>
                        <div className="text-xs text-zinc-500">{ind.value2.toFixed(2)}</div>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-zinc-900">{ind.value.toFixed(2)}</div>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-zinc-400">Updated: {ind.lastRefreshed}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
