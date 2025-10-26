// Type definitions for CursorTrade frontend

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
