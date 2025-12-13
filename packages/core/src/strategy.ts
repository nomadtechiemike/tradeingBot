import { PairStrategySettings, Signal, MarketSnapshot, OrderStatus, Order } from './types';

export class StrategyEngine {
  /**
   * Evaluate market conditions and generate signals
   */
  static evaluateSignals(
    snapshot: MarketSnapshot,
    settings: PairStrategySettings,
    openOrders: Order[]
  ): Signal | null {
    if (!settings.enabled) {
      return null;
    }

    // Find any open position for this pair
    const openPositions = openOrders.filter(
      (o) => o.status === 'OPEN' || o.status === 'PARTIAL'
    );

    // Check if we have an open buy order or already hold asset
    const hasBuyOrder = openPositions.some((o) => o.pair === snapshot.pair && o.side === 'BUY');
    const hasSellOrder = openPositions.some((o) => o.pair === snapshot.pair && o.side === 'SELL');

    // Simple rule-based strategy: price crosses triggers
    // BUY signal when price drops below buyTrigger (and no open buy)
    if (!hasBuyOrder && snapshot.lastPrice <= settings.buyTrigger) {
      return {
        pair: snapshot.pair,
        action: 'BUY',
        price: snapshot.lastPrice,
        reason: `Price ${snapshot.lastPrice} <= buyTrigger ${settings.buyTrigger}`
      };
    }

    // SELL signal when price rises above sellTrigger (and we have bought)
    // In v1, we check if we've filled a recent buy order
    const recentBuyFills = openPositions.some((o) => 
      o.pair === snapshot.pair && o.side === 'BUY' && o.filledQuantity > 0
    );

    if ((recentBuyFills || hasSellOrder) && snapshot.lastPrice >= settings.sellTrigger) {
      return {
        pair: snapshot.pair,
        action: 'SELL',
        price: snapshot.lastPrice,
        reason: `Price ${snapshot.lastPrice} >= sellTrigger ${settings.sellTrigger}`
      };
    }

    return {
      pair: snapshot.pair,
      action: 'HOLD',
      price: snapshot.lastPrice,
      reason: 'No signal met'
    };
  }

  /**
   * Calculate order quantity from THB amount and price
   */
  static calculateQuantity(orderSizeTHB: number, price: number): number {
    return parseFloat((orderSizeTHB / price).toFixed(8));
  }

  /**
   * Calculate fee amount
   */
  static calculateFee(quantity: number, price: number, feeRate: number): number {
    const totalCost = quantity * price;
    return parseFloat((totalCost * feeRate).toFixed(8));
  }
}
