
# 0) Scope & Constraints (technical)

* **Goal:** Convert NL queries → options strategy JSON → payoff + (realistic) backtest → explanation.
* **Stack:** Next.js (App Router) + Node API routes, TypeScript, Tailwind, Plotly (frontend), OpenAI/LLM, optional Python microservice for pricing (if you want QuantLib/py_vollib).
* **Backtest realism levels:**
  L1 = Simulated options via Black–Scholes; L2 = Historical chains via external provider (Polygon/ORATS).

---

# 1) System Architecture

```
Browser (Next.js)
  ├─ UI: 75/25 layout (chart left / chat right)
  ├─ Calls REST endpoints
  │
Server (Next.js API routes; or Next + small Python svc)
  ├─ /api/intent        -> LLM extract {ticker,bias,expiry}
  ├─ /api/data          -> stock data (live or mock)
  ├─ /api/strategy      -> LLM build strategy JSON
  ├─ /api/payoff        -> payoff curve from legs
  ├─ /api/backtest      -> L1 simulate / L2 real chain
  ├─ /api/explain       -> LLM explanation/Q&A
  └─ /api/health        -> readiness
  (optional) Python svc -> pricing/orchestrated backtest
```

**Data flow (end-to-end):**
`/api/intent` → `/api/data` → `/api/strategy` → `/api/payoff` → `/api/backtest` → UI renders.

---

# 2) Repo & Directory Structure

```
cursortrade/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                        # root UI (split layout)
│  └─ api/
│     ├─ intent/route.ts
│     ├─ data/route.ts
│     ├─ strategy/route.ts
│     ├─ payoff/route.ts
│     ├─ backtest/route.ts
│     ├─ explain/route.ts
│     └─ health/route.ts
├─ lib/
│  ├─ llm.ts                          # OpenAI client + helpers
│  ├─ data.ts                         # stock fetchers (live/mock)
│  ├─ strategy.ts                     # JSON schema & helpers
│  ├─ payoff.ts                       # payoff calculators
│  ├─ blackscholes.ts                 # BS pricing + Greeks
│  ├─ backtest.ts                     # L1 simulate engine
│  ├─ metrics.ts                      # performance metrics
│  └─ logger.ts                       # pino/winston wrapper
├─ components/
│  ├─ ChartPayoff.tsx
│  ├─ StrategyBanner.tsx
│  ├─ GreeksTable.tsx
│  ├─ BacktestPanel.tsx
│  └─ ChatConsole.tsx
├─ types/
│  └─ index.ts                        # shared TS types
├─ scripts/
│  └─ load-env-check.mjs
├─ .env.local.example
├─ package.json
└─ tsconfig.json
```

---

# 3) Tech Stack & Libraries

* **Framework:** `next`, `react`, `react-dom`, `typescript`
* **Styling:** `tailwindcss`, `postcss`, `autoprefixer`, `clsx`
* **Charts:** `react-plotly.js`, `plotly.js`
* **HTTP/Fetch:** native `fetch` or `axios` (pick one)
* **LLM:** `openai` (server-side only)
* **Logging:** `pino` or `winston`
* **Validation:** `zod` (for request/response schemas)
* **Optional Python svc:** `fastapi`, `py_vollib` or `QuantLib` (if you need high-fidelity Greeks/pricing)

---

# 4) Type Models (TypeScript)

```ts
// types/index.ts
export type Bias = "bullish" | "bearish" | "neutral";

export interface Intent {
  ticker: string;      // "AAPL"
  bias: Bias;          // "bullish"
  expiryISO?: string;  // "2025-11-15" (normalized)
  tenor?: string;      // "next month" (raw)
}

export interface MarketSnapshot {
  ticker: string;
  asOf: string;        // ISO timestamp
  spot: number;        // underlying price
  iv?: number;         // scalar (annualized)
  r?: number;          // risk-free rate
  divYield?: number;   // optional
}

export interface StrategyLeg {
  action: "buy" | "sell";
  optType: "call" | "put";
  strike: number;
  expiryISO: string;
  qty: number;         // positive integers
  premium?: number;    // entry price for the option
}

export interface Strategy {
  name: string;            // "Bull Call Spread"
  legs: StrategyLeg[];
  rationale: string;
  maxProfit?: number;
  maxLoss?: number;
  breakeven?: number;
  cost?: number;           // net debit/credit at entry
}

export interface PayoffSeries {
  prices: number[];        // x
  pl: number[];            // y
  atExpiry: boolean;       // true if expiry payoff
}

export interface BacktestResult {
  dates: string[];         // ISO days
  portfolioValue: number[];// MTM series
  dailyReturn: number[];   // per-day returns
  totalReturn: number;
  winRate: number;
  sharpe: number;
  notes?: string[];
}
```

---

# 5) API Contracts

### `POST /api/intent`

**Req:** `{ text: string }`
**Res:** `Intent`
**Server:** LLM extraction; normalize ticker; map “next month” → ISO using calendar utils.

### `POST /api/data`

**Req:** `{ ticker: string, from?: string, to?: string }`
**Res:** `MarketSnapshot` (spot, iv?, r?).
**Server:** live (provider SDK) or mock.

### `POST /api/strategy`

**Req:** `{ intent: Intent, market: MarketSnapshot }`
**Res:** `Strategy`
**Server:** LLM template: propose one strategy obeying bias, closest liquid strikes, 1-lot sizing, compute net debit/credit.

### `POST /api/payoff`

**Req:** `{ strategy: Strategy, spotGrid?: {from:number;to:number;steps:number} }`
**Res:** `PayoffSeries`
**Server:** deterministic payoff at expiry (vectorized). If premiums provided, include entry cost.

### `POST /api/backtest`

**Req:** `{ strategy: Strategy, market: MarketSnapshot, mode: "simulate" | "historical", range: {from:string; to:string} }`
**Res:** `BacktestResult`
**Server:** L1 simulate (BS daily MTM) or L2 real historical (if provider).

### `POST /api/explain`

**Req:** `{ strategy: Strategy, question?: string }`
**Res:** `{ text: string }`
**Server:** LLM explanation against strategy JSON.

---

# 6) LLM Prompts (server-side)

* **Intent Prompt:** extract `{ticker,bias,expiry}` as strict JSON; reject hallucinations; zod-validate.
* **Strategy Prompt:** given `intent + market`, emit a single strategy with numeric strikes, ISO expiry, computed `cost` (premium buy-sell sum) and optional `breakeven`. Constrain tokens; require JSON; add refusal if missing ticker.

**Hardening:** Always wrap with JSON-only system message and post-validate with `zod`. If parse fails → deterministic fallback template per bias:

* bullish → bull call spread
* bearish → bear put spread
* neutral → short strangle (demo only; mark as higher risk)

---

# 7) Core Calculations

## 7.1 Payoff at Expiry (deterministic)

For each leg (qty can be >1):

```
Call payoff at expiry:  max(0, S_T - K)
Put payoff at expiry:   max(0, K - S_T)

Signed payoff per leg:  (buy ? +1 : -1) * qty * payoff
Strategy payoff:        sum(leg payoffs) - entryCost
```

Create `spotGrid` around current spot (±30% by default). Vectorize loops for speed.

## 7.2 Simulated Pricing (for backtest L1)

Daily MTM using **Black–Scholes** (no early exercise):

```
d1 = [ln(S/K) + (r + 0.5σ²)*t] / (σ√t)
d2 = d1 - σ√t
call = S·N(d1) - K·e^{-rt}·N(d2)
put  = K·e^{-rt}·N(-d2) - S·N(-d1)
```

* `t` = time to option expiry (in years) from each backtest date.
* `σ` = IV proxy: rolling 20-day stdev × sqrt(252) OR fixed (market.iv).
* Greeks optional (Delta/Theta/Vega) from BS if you want overlays.
* Transaction costs: add per-leg fee on entry/exit if desired.

**Portfolio MTM per day:** sum(signed option prices) − entryCost.

## 7.3 Historical Chains (backtest L2)

* Provider data: fetch historical quote for each leg’s contract `(type,strike,expiry)` per day.
* Replace BS price with provider’s settlement/mark.
* Everything else identical (MTM, returns, metrics).

## 7.4 Metrics

```
dailyReturn[i] = (V[i] - V[i-1]) / V[i-1]
totalReturn = (V[end] - V[0]) / V[0]
winRate = count(dailyReturn > 0) / N
sharpe = mean(dailyReturn) / std(dailyReturn) * sqrt(252)
```

---

# 8) Implementation Steps (sequenced)

## Phase A — Project & Infra

1. `npx create-next-app@latest cursortrade --ts`
2. Tailwind init; dark theme tokens; base layout.
3. Add libs: `openai zod pino react-plotly.js plotly.js`.
4. Create `.env.local` with `OPENAI_API_KEY`, provider keys (if any).
5. Implement `/api/health` returning `{ok:true, ts}`.

## Phase B — Intent → Strategy

1. `/api/intent`: LLM extract + zod validate → `Intent`.
2. `/api/data`: stub market snapshot (mock first).
3. `/api/strategy`: LLM → `Strategy` (with numeric strikes, ISO dates, `cost`).
4. Add runtime guards (min/max strikes, expiry horizon sanity).

## Phase C — Payoff Engine

1. Implement vectorized payoff in `lib/payoff.ts`.
2. `/api/payoff` uses `Strategy` → `PayoffSeries`.
3. Unit tests (edge cases: deep ITM/OTM; credits; zero-cost).

## Phase D — Backtest Engine (L1 Sim)

1. Implement BS pricing + CND in `lib/blackscholes.ts`.
2. `/api/backtest?mode=simulate`:

   * Pull daily `S` series (mock or yfinance-like data cached).
   * Compute per-day MTM until expiry or range end.
   * Build `BacktestResult` with metrics.
3. Optional caching by `{ticker, expiry, strikes}` key.

## Phase E — Backtest Engine (L2 Real)

1. Abstract pricing provider interface:
   `getOptionMark(ticker, type, K, expiry, date) -> number`
2. Implement a provider (Polygon/ORATS) behind a feature flag.
3. Swap BS price with provider’s mark when `mode="historical"`.

## Phase F — Explanation

1. `/api/explain`: LLM on `{strategy, market, question?}` → plain text.
2. Safety filter: never provide advice—only mechanics and risks.

## Phase G — Observability & Hardening

1. Add `pino` structured logs (request id, latency, route).
2. Add `zod` validation to every route’s input/output.
3. Add rate-limiting (middleware) to LLM endpoints.
4. Add graceful error envelopes: `{error:{code,message}}`.

## Phase H — Frontend Wiring (minimal)

1. Wire form → `/api/intent` → `/api/data` → `/api/strategy`.
2. When strategy returns, parallel call `/api/payoff` + `/api/backtest`.
3. Render Plotly payoff + backtest sparkline; show summary banner.
4. Chat console POSTs to `/api/explain`.

## Phase I — Deployment

1. Vercel project: Next.js SSR + Edge/Node runtime selection.
2. Protect env vars; set `OPENAI_API_KEY` in Vercel.
3. Add cron (optional) to refresh caches.

---

# 9) Endpoint Skeletons (concise, TS)

```ts
// app/api/intent/route.ts
import { z } from "zod"; import { openai } from "@/lib/llm";
const Req = z.object({ text: z.string().min(2) });

export async function POST(req: Request) {
  const body = Req.parse(await req.json());
  const prompt = `Extract {ticker,bias,expiry} as JSON... Text: "${body.text}"`;
  const out = await openai.chat.completions.create({ model:"gpt-4o-mini", messages:[{role:"user",content:prompt}] });
  const intent = JSON.parse(out.choices[0].message.content);
  // validate normalized intent here with zod again
  return Response.json(intent);
}
```

```ts
// app/api/payoff/route.ts
import { z } from "zod"; import { payoffSeries } from "@/lib/payoff";
const Req = z.object({ strategy: z.any(), spotGrid: z.object({from:z.number(),to:z.number(),steps:z.number()}).optional() });

export async function POST(req: Request) {
  const { strategy, spotGrid } = Req.parse(await req.json());
  const series = payoffSeries(strategy, spotGrid);
  return Response.json(series);
}
```

(Repeat for `/api/strategy`, `/api/backtest`, `/api/explain` with the contracts above.)

---

# 10) Backtest L1 Algorithm (simulate) — Execution Plan

1. **Inputs:** `Strategy`, `range:{from,to}`, `MarketSnapshot`.
2. **Load underlying series** (daily close) for `[from,to]`.
3. **For each day d:**

   * `S = close[d]`
   * `t = max((expiry - d)/365, ε)`
   * `σ = ivProxy(d)` (rolling stdev or fixed)
   * Price each leg via BS; apply sign by `action` & `qty`.
   * `V[d] = sum(legPrices) - entryCost`
4. **Metrics:** `dailyReturn`, `totalReturn`, `winRate`, `sharpe`.
5. **Output:** `BacktestResult`.

**Complexity:** O(N·L) per series (N days, L legs) — trivial.

---

# 11) Caching & Performance

* **LLM outputs:** cache intent/strategy by `{text}` hash for 5–15 min.
* **Market data:** in-memory LRU keyed by `{ticker,range}`.
* **Backtest:** cache by `{ticker,expiry,strikes,range,mode}`.
* **Chunked responses:** send payoff immediately; backtest when ready (if you later choose streaming).

---

# 12) Security & Runtime

* Server-side only LLM keys.
* Input sanitization (tickers A-Z only).
* Rate-limit `/api/intent` & `/api/strategy`.
* CORS: allow same origin (or specific domain).
* Error envelope format:
  `{ error: { code: "E_PARSE", message: "…" } }`.

---

# 13) Testing Plan

* **Unit:** payoff edge cases; BS pricing sanity; metrics math.
* **Contract tests:** zod parse for each endpoint (happy/sad paths).
* **Integration:** end-to-end “AAPL bullish next month” golden JSON.
* **Perf:** backtest 1Y daily under 100ms (simulate mode) on Vercel Node.

---

# 14) Feature Flags (config)

* `BACKTEST_MODE = simulate | historical`
* `USE_PROVIDER = none | polygon | orats`
* `IV_SOURCE = fixed | rolling-stdev | provider`

Use env vars to toggle without code changes.

---

# 15) Deliverables Checklist (build order)

1. ✅ Types & zod schemas
2. ✅ `/api/intent` (LLM)
3. ✅ `/api/data` (mock spot)
4. ✅ `/api/strategy` (LLM)
5. ✅ `lib/payoff.ts` + `/api/payoff`
6. ✅ `lib/blackscholes.ts` + `/api/backtest?mode=simulate`
7. ✅ Metrics aggregation
8. ✅ `/api/explain` (LLM)
9. ✅ Logging, rate limits, error envelopes
10. ✅ Minimal UI wiring (chart + banner + chat)
11. ✅ Deploy + environment secrets

---

This is the complete technical map to build CursorTrade end-to-end. If you want, I can turn this into a **GitHub project board** with tasks/issues and provide **code stubs** for each API route next.
