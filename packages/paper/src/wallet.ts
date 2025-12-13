import { Balances, Order, OrderSide, Pair, Fill } from '../../core/src/types';

export interface FillSimulationResult {
  filled: boolean;
  quantity: number;
  price: number;
  fee: number;
  reason: string;
}

/**
 * Paper trading wallet and fill simulator
 */
export class PaperWallet {
  private balances: Balances;
  private feeRate: number;
  private slippage: number;

  constructor(initialBalances: Balances, feeRate: number = 0.0025, slippage: number = 0) {
    this.balances = { ...initialBalances };
    this.feeRate = feeRate;
    this.slippage = slippage;
  }

  getBalances(): Balances {
    return { ...this.balances };
  }

  setBalances(balances: Balances): void {
    this.balances = { ...balances };
  }

  /**
   * Simulate filling a limit order based on market conditions
   * For BUY: fill when bestAsk <= limitPrice (we can buy at or below our limit)
   * For SELL: fill when bestBid >= limitPrice (we can sell at or above our limit)
   */
  simulateFill(
    order: Order,
    bestBid: number,
    bestAsk: number,
    lastPrice: number
  ): FillSimulationResult {
    if (order.side === 'BUY') {
      // For buy orders, fill when the ask price (what we must pay) is at or below our limit
      const fillPrice = bestAsk * (1 + this.slippage);

      if (fillPrice <= order.price) {
        const fee = order.quantity * fillPrice * this.feeRate;
        return {
          filled: true,
          quantity: order.quantity,
          price: fillPrice,
          fee,
          reason: `Buy order filled: bestAsk ${bestAsk} <= limit ${order.price}`
        };
      }

      return {
        filled: false,
        quantity: 0,
        price: 0,
        fee: 0,
        reason: `Buy order not filled: bestAsk ${bestAsk} > limit ${order.price}`
      };
    } else {
      // For sell orders, fill when the bid price (what we receive) is at or above our limit
      const fillPrice = bestBid * (1 - this.slippage);

      if (fillPrice >= order.price) {
        const fee = order.quantity * fillPrice * this.feeRate;
        return {
          filled: true,
          quantity: order.quantity,
          price: fillPrice,
          fee,
          reason: `Sell order filled: bestBid ${bestBid} >= limit ${order.price}`
        };
      }

      return {
        filled: false,
        quantity: 0,
        price: 0,
        fee: 0,
        reason: `Sell order not filled: bestBid ${bestBid} < limit ${order.price}`
      };
    }
  }

  /**
   * Update balances after a fill
   */
  updateBalancesOnFill(order: Order, fillQuantity: number, fillPrice: number, fee: number): void {
    const asset = this.getAssetName(order.pair);

    if (order.side === 'BUY') {
      const totalCost = fillQuantity * fillPrice + fee;
      this.balances.thb -= totalCost;
      this.balances[asset as keyof Balances] += fillQuantity;
    } else {
      const totalReceived = fillQuantity * fillPrice - fee;
      this.balances.thb += totalReceived;
      this.balances[asset as keyof Balances] -= fillQuantity;
    }

    // Ensure no negative balances (shouldn't happen if risk engine works)
    Object.keys(this.balances).forEach((key) => {
      if (this.balances[key as keyof Balances] < 0) {
        console.warn(`Negative balance detected for ${key}: ${this.balances[key as keyof Balances]}`);
        this.balances[key as keyof Balances] = 0;
      }
    });
  }

  /**
   * Calculate portfolio value in THB
   */
  calculatePortfolioValue(btcPrice: number, ethPrice: number): number {
    const btcValue = this.balances.btc * btcPrice;
    const ethValue = this.balances.eth * ethPrice;
    return this.balances.thb + btcValue + ethValue;
  }

  private getAssetName(pair: Pair): string {
    return pair.split('/')[0].toLowerCase();
  }
}
