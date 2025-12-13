export type TradingMode = 'PAPER' | 'LIVE';
export type OrderSide = 'BUY' | 'SELL';
export type Pair = 'BTC/THB' | 'ETH/THB';

export interface PairStrategySettings {
  enabled: boolean;
  buyTrigger: number;
  sellTrigger: number;
  orderSizeTHB: number;
}

export interface RiskLimits {
  maxTHBPerTrade: number;
  maxExposureTHBPerPair: number;
  maxOpenOrders: number;
  maxDailyLossTHB: number;
}

export interface Order {
  id?: number;
  mode: TradingMode;
  pair: Pair;
  side: OrderSide;
  price: number;
  quantity: number;
  status: 'OPEN' | 'FILLED' | 'CANCELLED';
  createdAt?: string;
}

export interface Fill {
  id?: number;
  orderId: number;
  price: number;
  quantity: number;
  fee: number;
  createdAt?: string;
}

export interface Balances {
  thb: number;
  btc: number;
  eth: number;
}
