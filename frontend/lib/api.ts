// API client functions

const API_BASE = 'http://localhost:8000';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Extract trading intent from natural language
 */
export async function extractIntent(text: string) {
  const response = await fetch(`${API_BASE}/api/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to extract intent');
  }

  return data;
}

/**
 * General chat (legacy endpoint)
 */
export async function chat(message: string) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get response');
  }

  return data.response;
}

// Market data snapshot from backend
export async function getMarketData(ticker: string) {
  const response = await fetch(`${API_BASE}/api/data?ticker=${encodeURIComponent(ticker)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch market data');
  }
  return data?.data;
}

// Alpha Vantage indicators via backend
export async function getIndicators(ticker: string) {
  const qs = (obj: Record<string, string | number | undefined>) =>
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');

  const endpoints = [
    { key: 'dema', path: '/api/alpha/dema', params: { symbol: ticker, interval: 'daily', time_period: 20, series_type: 'close' } },
    { key: 'tema', path: '/api/alpha/tema', params: { symbol: ticker, interval: 'daily', time_period: 20, series_type: 'close' } },
    { key: 'wma', path: '/api/alpha/wma', params: { symbol: ticker, interval: 'daily', time_period: 20, series_type: 'close' } },
    { key: 'mama', path: '/api/alpha/mama', params: { symbol: ticker, interval: 'daily', series_type: 'close' } },
    { key: 'roc', path: '/api/alpha/roc', params: { symbol: ticker, interval: 'daily', time_period: 10, series_type: 'close' } },
    { key: 'ppo', path: '/api/alpha/ppo', params: { symbol: ticker, interval: 'daily', series_type: 'close' } },
    { key: 'aroon', path: '/api/alpha/aroon', params: { symbol: ticker, interval: 'daily', time_period: 14 } },
    { key: 'ultosc', path: '/api/alpha/ultosc', params: { symbol: ticker, interval: 'daily', time_period1: 7, time_period2: 14, time_period3: 28 } },
    { key: 'mom', path: '/api/alpha/mom', params: { symbol: ticker, interval: 'daily', time_period: 10, series_type: 'close' } },
    { key: 'bbands', path: '/api/alpha/bbands', params: { symbol: ticker, interval: 'daily', time_period: 20, series_type: 'close' } },
    { key: 'stddev', path: '/api/alpha/stddev', params: { symbol: ticker, interval: 'daily', time_period: 10, series_type: 'close' } },
    { key: 'sar', path: '/api/alpha/sar', params: { symbol: ticker, interval: 'daily', series_type: 'close' } },
    { key: 'cmo', path: '/api/alpha/cmo', params: { symbol: ticker, interval: 'daily', time_period: 14, series_type: 'close' } },
    { key: 'frama', path: '/api/alpha/frama', params: { symbol: ticker, interval: 'daily', time_period: 10, series_type: 'close' } },
    { key: 'ht_phasor', path: '/api/alpha/ht_phasor', params: { symbol: ticker, interval: 'daily', series_type: 'close' } },
    { key: 'ht_sine', path: '/api/alpha/ht_sine', params: { symbol: ticker, interval: 'daily', series_type: 'close' } },
  ];

  const results: Record<string, any> = {};
  await Promise.all(
    endpoints.map(async ({ key, path, params }) => {
      try {
        const url = `${API_BASE}${path}?${qs(params)}`;
        const r = await fetch(url);
        const json = await r.json();
        results[key] = r.ok ? json : { error: json?.error || 'request failed' };
      } catch (e: any) {
        results[key] = { error: e?.message || 'network error' };
      }
    })
  );
  return results;
}
