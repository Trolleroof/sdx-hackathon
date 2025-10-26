// Type definitions for CursorTrade
import { z } from 'zod';

// Bias types
export const BiasSchema = z.enum(['bullish', 'bearish', 'neutral']);

// Intent type - extracted from user query
export const IntentSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').toUpperCase(),
  bias: BiasSchema,
  expiryISO: z.string().optional(), // ISO date string like "2025-11-15"
  tenor: z.string().optional(), // Raw text like "next month"
});

// Market snapshot
export const MarketSnapshotSchema = z.object({
  ticker: z.string(),
  asOf: z.string(), // ISO timestamp
  spot: z.number(),
  iv: z.number().optional(), // implied volatility (annualized)
  r: z.number().optional(), // risk-free rate
  divYield: z.number().optional(),
});

// Strategy leg
export const StrategyLegSchema = z.object({
  action: z.enum(['buy', 'sell']),
  optType: z.enum(['call', 'put']),
  strike: z.number(),
  expiryISO: z.string(),
  qty: z.number().int().positive(),
  premium: z.number().optional(),
});

// Full strategy
export const StrategySchema = z.object({
  name: z.string(),
  legs: z.array(StrategyLegSchema),
  rationale: z.string(),
  maxProfit: z.number().optional(),
  maxLoss: z.number().optional(),
  breakeven: z.number().optional(),
  cost: z.number().optional(),
});

// Payoff series
export const PayoffSeriesSchema = z.object({
  prices: z.array(z.number()),
  pl: z.array(z.number()),
  atExpiry: z.boolean(),
});

// Backtest result
export const BacktestResultSchema = z.object({
  dates: z.array(z.string()),
  portfolioValue: z.array(z.number()),
  dailyReturn: z.array(z.number()),
  totalReturn: z.number(),
  winRate: z.number(),
  sharpe: z.number(),
  notes: z.array(z.string()).optional(),
});

// Note: This is a JavaScript file, so we export schemas for runtime validation
// TypeScript type definitions are in frontend/types/index.ts
