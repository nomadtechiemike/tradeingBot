"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var risk_1 = require("../src/risk");
(0, vitest_1.describe)('RiskEngine', function () {
    var mockBalances = {
        thb: 20000,
        btc: 0.01,
        eth: 0.5
    };
    var mockRiskLimits = {
        maxTHBPerTrade: 10000,
        maxExposureTHBPerPair: 50000,
        maxOpenOrders: 5,
        maxDailyLossTHB: -5000
    };
    (0, vitest_1.describe)('checkOrderAllowed', function () {
        (0, vitest_1.it)('should allow valid buy order', function () {
            var result = risk_1.RiskEngine.checkOrderAllowed('BUY', 'BTC/THB', 0.004, 1250000, mockBalances, [], mockRiskLimits, false, 0);
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should block order when kill switch is enabled', function () {
            var result = risk_1.RiskEngine.checkOrderAllowed('BUY', 'BTC/THB', 0.004, 1250000, mockBalances, [], mockRiskLimits, true, // kill switch
            0);
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Kill switch');
        });
        (0, vitest_1.it)('should block order when daily loss exceeds limit', function () {
            var result = risk_1.RiskEngine.checkOrderAllowed('BUY', 'BTC/THB', 0.004, 1250000, mockBalances, [], mockRiskLimits, false, -6000 // exceeds -5000 limit
            );
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Daily loss');
        });
        (0, vitest_1.it)('should block order when max open orders reached', function () {
            var openOrders = Array(5).fill(null).map(function (_, i) { return ({
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
            }); });
            var result = risk_1.RiskEngine.checkOrderAllowed('BUY', 'BTC/THB', 0.004, 1250000, mockBalances, openOrders, mockRiskLimits, false, 0);
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Open orders');
        });
        (0, vitest_1.it)('should block order when trade value exceeds max per trade', function () {
            var result = risk_1.RiskEngine.checkOrderAllowed('BUY', 'BTC/THB', 0.01, // 0.01 * 1250000 = 12500 THB > 10000 limit
            1250000, mockBalances, [], mockRiskLimits, false, 0);
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Trade value');
        });
        (0, vitest_1.it)('should block buy order when insufficient THB balance', function () {
            var poorBalances = {
                thb: 1000,
                btc: 0,
                eth: 0
            };
            var result = risk_1.RiskEngine.checkOrderAllowed('BUY', 'BTC/THB', 0.004, 1250000, poorBalances, [], mockRiskLimits, false, 0);
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Insufficient THB');
        });
        (0, vitest_1.it)('should block sell order when insufficient asset balance', function () {
            var noBtcBalances = {
                thb: 20000,
                btc: 0,
                eth: 0
            };
            var result = risk_1.RiskEngine.checkOrderAllowed('SELL', 'BTC/THB', 0.004, 1250000, noBtcBalances, [], mockRiskLimits, false, 0);
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Insufficient');
        });
    });
    (0, vitest_1.describe)('calculatePnL', function () {
        (0, vitest_1.it)('should calculate profit correctly', function () {
            var pnl = risk_1.RiskEngine.calculatePnL(1200000, 1300000, 0.004, 12);
            (0, vitest_1.expect)(pnl).toBe(388); // (1300000 - 1200000) * 0.004 - 12 = 400 - 12 = 388
        });
        (0, vitest_1.it)('should calculate loss correctly', function () {
            var pnl = risk_1.RiskEngine.calculatePnL(1300000, 1200000, 0.004, 12);
            (0, vitest_1.expect)(pnl).toBe(-412); // (1200000 - 1300000) * 0.004 - 12 = -400 - 12 = -412
        });
        (0, vitest_1.it)('should handle zero fees', function () {
            var pnl = risk_1.RiskEngine.calculatePnL(1200000, 1300000, 0.004, 0);
            (0, vitest_1.expect)(pnl).toBe(400);
        });
    });
    (0, vitest_1.describe)('calculateDailyLoss', function () {
        (0, vitest_1.it)('should calculate loss correctly', function () {
            var loss = risk_1.RiskEngine.calculateDailyLoss(20000, 18000);
            (0, vitest_1.expect)(loss).toBe(-2000);
        });
        (0, vitest_1.it)('should calculate gain correctly', function () {
            var gain = risk_1.RiskEngine.calculateDailyLoss(20000, 22000);
            (0, vitest_1.expect)(gain).toBe(2000);
        });
        (0, vitest_1.it)('should return zero for no change', function () {
            var result = risk_1.RiskEngine.calculateDailyLoss(20000, 20000);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
});
