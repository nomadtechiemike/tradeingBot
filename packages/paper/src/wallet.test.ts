import { describe, it, expect, beforeEach } from 'vitest';
import { PaperWallet } from './wallet';
import { Balances, Order } from '../../core/src/types';

describe('PaperWallet', () => {
  let wallet: PaperWallet;
  const initialBalances: Balances = {
    thb: 20000,
    btc: 0,
    eth: 0
  };

  beforeEach(() => {
    wallet = new PaperWallet(initialBalances, 0.0025, 0);
  });

  describe('simulateFill', () => {
    const mockBuyOrder: Order = {
      id: 1,
      mode: 'PAPER',
      pair: 'BTC/THB',
      side: 'BUY',
      price: 1250000,
      quantity: 0.004,
      status: 'OPEN',
      filledQuantity: 0,
      fee: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockSellOrder: Order = {
      ...mockBuyOrder,
      id: 2,
      side: 'SELL'
    };

    it('should fill buy order when ask price is at or below limit', () => {
      const result = wallet.simulateFill(mockBuyOrder, 1245000, 1250000, 1248000);

      expect(result.filled).toBe(true);
      expect(result.price).toBe(1250000); // bestAsk
      expect(result.quantity).toBe(0.004);
      expect(result.fee).toBeGreaterThan(0);
    });

    it('should not fill buy order when ask price is above limit', () => {
      const result = wallet.simulateFill(mockBuyOrder, 1245000, 1255000, 1252000);

      expect(result.filled).toBe(false);
      expect(result.quantity).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('should fill sell order when bid price is at or above limit', () => {
      const result = wallet.simulateFill(mockSellOrder, 1250000, 1255000, 1252000);

      expect(result.filled).toBe(true);
      expect(result.price).toBe(1250000); // bestBid
      expect(result.quantity).toBe(0.004);
      expect(result.fee).toBeGreaterThan(0);
    });

    it('should not fill sell order when bid price is below limit', () => {
      const result = wallet.simulateFill(mockSellOrder, 1245000, 1255000, 1248000);

      expect(result.filled).toBe(false);
      expect(result.quantity).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('should apply slippage to fill price', () => {
      const walletWithSlippage = new PaperWallet(initialBalances, 0.0025, 0.001);
      const result = walletWithSlippage.simulateFill(mockBuyOrder, 1245000, 1250000, 1248000);

      expect(result.filled).toBe(true);
      expect(result.price).toBeGreaterThan(1250000); // ask + slippage
    });

    it('should calculate fee correctly', () => {
      const result = wallet.simulateFill(mockBuyOrder, 1245000, 1250000, 1248000);

      expect(result.filled).toBe(true);
      const expectedFee = 0.004 * 1250000 * 0.0025;
      expect(result.fee).toBeCloseTo(expectedFee, 2);
    });
  });

  describe('updateBalancesOnFill', () => {
    it('should update balances correctly after buy fill', () => {
      const order: Order = {
        id: 1,
        mode: 'PAPER',
        pair: 'BTC/THB',
        side: 'BUY',
        price: 1250000,
        quantity: 0.004,
        status: 'FILLED',
        filledQuantity: 0.004,
        fee: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const fillPrice = 1250000;
      const fillQuantity = 0.004;
      const fee = 12.5;

      wallet.updateBalancesOnFill(order, fillQuantity, fillPrice, fee);

      const balances = wallet.getBalances();
      expect(balances.btc).toBe(0.004);
      expect(balances.thb).toBeCloseTo(20000 - (1250000 * 0.004) - 12.5, 2);
    });

    it('should update balances correctly after sell fill', () => {
      // First add some BTC
      wallet.setBalances({ thb: 15000, btc: 0.004, eth: 0 });

      const order: Order = {
        id: 2,
        mode: 'PAPER',
        pair: 'BTC/THB',
        side: 'SELL',
        price: 1300000,
        quantity: 0.004,
        status: 'FILLED',
        filledQuantity: 0.004,
        fee: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const fillPrice = 1300000;
      const fillQuantity = 0.004;
      const fee = 13;

      wallet.updateBalancesOnFill(order, fillQuantity, fillPrice, fee);

      const balances = wallet.getBalances();
      expect(balances.btc).toBe(0);
      expect(balances.thb).toBeCloseTo(15000 + (1300000 * 0.004) - 13, 2);
    });

    it('should prevent negative balances', () => {
      const order: Order = {
        id: 1,
        mode: 'PAPER',
        pair: 'BTC/THB',
        side: 'BUY',
        price: 1250000,
        quantity: 0.02, // Way more than we can afford
        status: 'FILLED',
        filledQuantity: 0.02,
        fee: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      wallet.updateBalancesOnFill(order, 0.02, 1250000, 625);

      const balances = wallet.getBalances();
      expect(balances.thb).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculatePortfolioValue', () => {
    it('should calculate total value correctly', () => {
      wallet.setBalances({ thb: 10000, btc: 0.004, eth: 0.5 });

      const btcPrice = 1250000;
      const ethPrice = 40000;
      const totalValue = wallet.calculatePortfolioValue(btcPrice, ethPrice);

      expect(totalValue).toBe(10000 + (0.004 * 1250000) + (0.5 * 40000));
      expect(totalValue).toBe(35000);
    });

    it('should handle zero crypto balances', () => {
      const totalValue = wallet.calculatePortfolioValue(1250000, 40000);

      expect(totalValue).toBe(20000); // Only THB balance
    });

    it('should handle zero THB balance', () => {
      wallet.setBalances({ thb: 0, btc: 0.004, eth: 0.5 });

      const totalValue = wallet.calculatePortfolioValue(1250000, 40000);

      expect(totalValue).toBe((0.004 * 1250000) + (0.5 * 40000));
      expect(totalValue).toBe(25000);
    });
  });
});
