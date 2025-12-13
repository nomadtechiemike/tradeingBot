import { describe, it, expect } from 'vitest';
import { StrategyEngine } from '../src/strategy';
import { MarketSnapshot, PairStrategySettings, Order } from '../src/types';

describe('StrategyEngine', () => {
  const mockSnapshot: MarketSnapshot = {
    pair: 'BTC/THB',
    lastPrice: 1250000,
    bestBid: 1249000,
    bestAsk: 1251000,
    timestamp: Date.now()
  };

  const mockSettings: PairStrategySettings = {
    enabled: true,
    buyTrigger: 1200000,
    sellTrigger: 1300000,
    orderSizeTHB: 5000
  };

  describe('evaluateSignals', () => {
    it('should return BUY signal when price is below buy trigger', () => {
      const snapshot = { ...mockSnapshot, lastPrice: 1190000 };
      const signal = StrategyEngine.evaluateSignals(snapshot, mockSettings, []);

      expect(signal).not.toBeNull();
      expect(signal?.action).toBe('BUY');
      expect(signal?.pair).toBe('BTC/THB');
      expect(signal?.price).toBe(1190000);
    });

    it('should return SELL signal when price is above sell trigger and have position', () => {
      const snapshot = { ...mockSnapshot, lastPrice: 1310000 };
      const openOrder: Order = {
        id: 1,
        mode: 'PAPER',
        pair: 'BTC/THB',
        side: 'BUY',
        price: 1200000,
        quantity: 0.004,
        status: 'FILLED',
        filledQuantity: 0.004,
        filledPrice: 1200000,
        fee: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const signal = StrategyEngine.evaluateSignals(snapshot, mockSettings, [openOrder]);

      expect(signal).not.toBeNull();
      expect(signal?.action).toBe('SELL');
      expect(signal?.price).toBe(1310000);
    });

    it('should return HOLD when price is between triggers', () => {
      const signal = StrategyEngine.evaluateSignals(mockSnapshot, mockSettings, []);

      expect(signal).not.toBeNull();
      expect(signal?.action).toBe('HOLD');
    });

    it('should return null when pair is disabled', () => {
      const disabledSettings = { ...mockSettings, enabled: false };
      const signal = StrategyEngine.evaluateSignals(mockSnapshot, disabledSettings, []);

      expect(signal).toBeNull();
    });

    it('should not generate BUY signal if already have open buy order', () => {
      const snapshot = { ...mockSnapshot, lastPrice: 1190000 };
      const openBuyOrder: Order = {
        id: 1,
        mode: 'PAPER',
        pair: 'BTC/THB',
        side: 'BUY',
        price: 1195000,
        quantity: 0.004,
        status: 'OPEN',
        filledQuantity: 0,
        fee: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const signal = StrategyEngine.evaluateSignals(snapshot, mockSettings, [openBuyOrder]);

      expect(signal?.action).toBe('HOLD');
    });
  });

  describe('calculateQuantity', () => {
    it('should calculate correct quantity from THB amount', () => {
      const quantity = StrategyEngine.calculateQuantity(5000, 1250000);
      expect(quantity).toBe(0.004); // 5000 / 1250000
    });

    it('should round to 8 decimal places', () => {
      const quantity = StrategyEngine.calculateQuantity(1000, 1234567);
      expect(quantity.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(8);
    });
  });

  describe('calculateFee', () => {
    it('should calculate fee correctly', () => {
      const fee = StrategyEngine.calculateFee(0.004, 1250000, 0.0025);
      expect(fee).toBe(12.5); // 0.004 * 1250000 * 0.0025 = 12.5
    });

    it('should handle zero fee rate', () => {
      const fee = StrategyEngine.calculateFee(0.004, 1250000, 0);
      expect(fee).toBe(0);
    });
  });
});
