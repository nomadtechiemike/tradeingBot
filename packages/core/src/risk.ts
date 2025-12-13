import { RiskLimits, Order, Balances, OrderSide, Pair } from './types';

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
}

export class RiskEngine {
  /**
   * Check if an order is allowed given current state
   */
  static checkOrderAllowed(
    side: OrderSide,
    pair: Pair,
    quantity: number,
    price: number,
    balances: Balances,
    openOrders: Order[],
    riskLimits: RiskLimits,
    killSwitch: boolean,
    dailyLoss: number
  ): RiskCheckResult {
    // Kill switch blocks everything
    if (killSwitch) {
      return { allowed: false, reason: 'Kill switch is enabled' };
    }

    // Check daily loss limit
    if (dailyLoss <= riskLimits.maxDailyLossTHB) {
      return { allowed: false, reason: `Daily loss ${dailyLoss} exceeds limit ${riskLimits.maxDailyLossTHB}` };
    }

    // Check max open orders
    const openOrderCount = openOrders.filter((o) => o.status === 'OPEN' || o.status === 'PARTIAL').length;
    if (openOrderCount >= riskLimits.maxOpenOrders) {
      return { allowed: false, reason: `Open orders ${openOrderCount} >= limit ${riskLimits.maxOpenOrders}` };
    }

    // Check max THB per trade
    const tradeValue = quantity * price;
    if (tradeValue > riskLimits.maxTHBPerTrade) {
      return { allowed: false, reason: `Trade value ${tradeValue} > limit ${riskLimits.maxTHBPerTrade}` };
    }

    // For BUY orders: check if we have enough THB
    if (side === 'BUY') {
      const totalBuyValue = quantity * price;
      if (balances.thb < totalBuyValue) {
        return { allowed: false, reason: `Insufficient THB: have ${balances.thb}, need ${totalBuyValue}` };
      }

      // Check max exposure per pair
      const pairExposure = this.calculatePairExposure(pair, 'BUY', quantity, price, openOrders, balances);
      if (pairExposure > riskLimits.maxExposureTHBPerPair) {
        return {
          allowed: false,
          reason: `Pair exposure ${pairExposure} > limit ${riskLimits.maxExposureTHBPerPair}`
        };
      }
    }

    // For SELL orders: check if we have enough asset
    if (side === 'SELL') {
      const asset = pair === 'BTC/THB' ? balances.btc : balances.eth;
      if (asset < quantity) {
        return { allowed: false, reason: `Insufficient ${pair.split('/')[0]}: have ${asset}, need ${quantity}` };
      }
    }

    return { allowed: true };
  }

  /**
   * Calculate current exposure for a pair in THB
   */
  private static calculatePairExposure(
    pair: Pair,
    side: OrderSide,
    newQuantity: number,
    newPrice: number,
    openOrders: Order[],
    balances: Balances
  ): number {
    let exposure = 0;

    // Add value from open positions
    const openPositions = openOrders.filter((o) => o.pair === pair && (o.status === 'OPEN' || o.status === 'PARTIAL'));
    for (const order of openPositions) {
      if (order.side === 'BUY') {
        exposure += order.filledQuantity * (order.filledPrice || order.price);
      }
    }

    // Add new order
    if (side === 'BUY') {
      exposure += newQuantity * newPrice;
    }

    return exposure;
  }

  /**
   * Calculate PnL for a closed position
   */
  static calculatePnL(buyPrice: number, sellPrice: number, quantity: number, fees: number): number {
    const grossProfit = (sellPrice - buyPrice) * quantity;
    return grossProfit - fees;
  }

  /**
   * Calculate daily loss from today's equity change
   */
  static calculateDailyLoss(startBalance: number, currentBalance: number): number {
    return currentBalance - startBalance;
  }
}
