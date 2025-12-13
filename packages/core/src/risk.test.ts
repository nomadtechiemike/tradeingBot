import { describe, it, expect } from 'vitest';
import { RiskEngine } from '../src/risk';
import { RiskLimits, Order, Balances } from '../src/types';

describe('RiskEngine', () => {
  const mockBalances: Balances = {
    thb: 20000,
    btc: 0.01,
    eth: 0.5
  };

  const mockRiskLimits: RiskLimits = {
    maxTHBPerTrade: 10000,
    maxExposureTHBPerPair: 50000,
    maxOpenOrders: 5,
    maxDailyLossTHB: -5000
  };

  describe('checkOrderAllowed', () => {
    it('should allow valid buy order', () => {
      const result = RiskEngine.checkOrderAllowed(
        'BUY',
        'BTC/THB',
        0.004,
        1250000,
        mockBalances,
        [],
        mockRiskLimits,
        false,
        0
      );

      expect(result.allowed).toBe(true);
    });

    it('should block order when kill switch is enabled', () => {
      const result = RiskEngine.checkOrderAllowed(
        'BUY',
        'BTC/THB',
        0.004,
        1250000,
        mockBalances,
        [],
        mockRiskLimits,
        true, // kill switch
        0
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Kill switch');
    });

    it('should block order when daily loss exceeds limit', () => {
      const result = RiskEngine.checkOrderAllowed(
        'BUY',
        'BTC/THB',
        0.004,
        1250000,
        mockBalances,
        [],
        mockRiskLimits,
        false,
        -6000 // exceeds -5000 limit
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily loss');
    });

    it('should block order when max open orders reached', () => {
      const openOrders: Order[] = Array(5).fill(null).map((_, i) => ({
        id: i + 1,
        mode: 'PAPER',
        pair: 'BTC/THB',
        side: 'BUY',
        price: 1250000,
        quantity: 0.001,
        status: 'OPEN',
        filledQuantity: 0,
        fee: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const result = RiskEngine.checkOrderAllowed(
        'BUY',
        'BTC/THB',
        0.004,
        1250000,
        mockBalances,
        openOrders,
        mockRiskLimits,
        false,
        0
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Open orders');
    });

    it('should block order when trade value exceeds max per trade', () => {
      const result = RiskEngine.checkOrderAllowed(
        'BUY',
        'BTC/THB',
        0.01, // 0.01 * 1250000 = 12500 THB > 10000 limit
        1250000,
        mockBalances,
        [],
        mockRiskLimits,
        false,
        0
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Trade value');
    });

    it('should block buy order when insufficient THB balance', () => {
      const poorBalances: Balances = {
        thb: 1000,
        btc: 0,
        eth: 0
      };

      const result = RiskEngine.checkOrderAllowed(
        'BUY',
        'BTC/THB',
        0.004,
        1250000,
        poorBalances,
        [],
        mockRiskLimits,
        false,
        0
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient THB');
    });

    it('should block sell order when insufficient asset balance', () => {
      const noBtcBalances: Balances = {
        thb: 20000,
        btc: 0,
        eth: 0
      };

      const result = RiskEngine.checkOrderAllowed(
        'SELL',
        'BTC/THB',
        0.004,
        1250000,
        noBtcBalances,
        [],
        mockRiskLimits,
        false,
        0
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient');
    });
  });

  describe('calculatePnL', () => {
    it('should calculate profit correctly', () => {
      const pnl = RiskEngine.calculatePnL(1200000, 1300000, 0.004, 12);
      expect(pnl).toBe(388); // (1300000 - 1200000) * 0.004 - 12 = 400 - 12 = 388
    });

    it('should calculate loss correctly', () => {
      const pnl = RiskEngine.calculatePnL(1300000, 1200000, 0.004, 12);
      expect(pnl).toBe(-412); // (1200000 - 1300000) * 0.004 - 12 = -400 - 12 = -412
    });

    it('should handle zero fees', () => {
      const pnl = RiskEngine.calculatePnL(1200000, 1300000, 0.004, 0);
      expect(pnl).toBe(400);
    });
  });

  describe('calculateDailyLoss', () => {
    it('should calculate loss correctly', () => {
      const loss = RiskEngine.calculateDailyLoss(20000, 18000);
      expect(loss).toBe(-2000);
    });

    it('should calculate gain correctly', () => {
      const gain = RiskEngine.calculateDailyLoss(20000, 22000);
      expect(gain).toBe(2000);
    });

    it('should return zero for no change', () => {
      const result = RiskEngine.calculateDailyLoss(20000, 20000);
      expect(result).toBe(0);
    });
  });
});
