// Trading types
export type TradingMode = 'PAPER' | 'LIVE';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED' | 'PARTIAL';
export type Pair = 'BTC/THB' | 'ETH/THB';
export type EventLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

// Strategy settings per pair
export interface PairStrategySettings {
  enabled: boolean;
  buyTrigger: number; // price in THB
  sellTrigger: number; // price in THB
  orderSizeTHB: number;
}

// Risk limits
export interface RiskLimits {
  maxTHBPerTrade: number;
  maxExposureTHBPerPair: number;
  maxOpenOrders: number;
  maxDailyLossTHB: number; // negative value, e.g., -20000
}

// Balances
export interface Balances {
  thb: number;
  btc: number;
  eth: number;
}

// Market snapshot
export interface MarketSnapshot {
  pair: Pair;
  lastPrice: number;
  bestBid: number;
  bestAsk: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  change24h?: number;
  timestamp: number;
}

// Order
export interface Order {
  id: number;
  mode: TradingMode;
  pair: Pair;
  side: OrderSide;
  price: number;
  quantity: number;
  status: OrderStatus;
  filledQuantity: number;
  filledPrice?: number;
  fee: number;
  createdAt: Date;
  updatedAt: Date;
}

// Fill
export interface Fill {
  id: number;
  orderId: number;
  price: number;
  quantity: number;
  fee: number;
  createdAt: Date;
}

// Bot state
export interface BotState {
  isRunning: boolean;
  isPaused: boolean;
  killSwitch: boolean;
  lastPulseAt?: Date;
}

// Strategy signal
export interface Signal {
  pair: Pair;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  reason: string;
}

// Daily stats
export interface DailyStats {
  date: string;
  startBalance: number;
  endBalance: number;
  pnl: number;
  pnlPercent: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
}

// Runtime marker: ensure this file emits a JS module when compiled so imports
// like `./types` resolve at runtime in built packages.
export const __types_marker = true;
