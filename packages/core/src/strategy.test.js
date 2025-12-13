"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var strategy_1 = require("../src/strategy");
(0, vitest_1.describe)('StrategyEngine', function () {
    var mockSnapshot = {
        pair: 'BTC/THB',
        lastPrice: 1250000,
        bestBid: 1249000,
        bestAsk: 1251000,
        timestamp: Date.now()
    };
    var mockSettings = {
        enabled: true,
        buyTrigger: 1200000,
        sellTrigger: 1300000,
        orderSizeTHB: 5000
    };
    (0, vitest_1.describe)('evaluateSignals', function () {
        (0, vitest_1.it)('should return BUY signal when price is below buy trigger', function () {
            var snapshot = __assign(__assign({}, mockSnapshot), { lastPrice: 1190000 });
            var signal = strategy_1.StrategyEngine.evaluateSignals(snapshot, mockSettings, []);
            (0, vitest_1.expect)(signal).not.toBeNull();
            (0, vitest_1.expect)(signal === null || signal === void 0 ? void 0 : signal.action).toBe('BUY');
            (0, vitest_1.expect)(signal === null || signal === void 0 ? void 0 : signal.pair).toBe('BTC/THB');
            (0, vitest_1.expect)(signal === null || signal === void 0 ? void 0 : signal.price).toBe(1190000);
        });
        (0, vitest_1.it)('should return SELL signal when price is above sell trigger and have position', function () {
            var snapshot = __assign(__assign({}, mockSnapshot), { lastPrice: 1310000 });
            var openOrder = {
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
            var signal = strategy_1.StrategyEngine.evaluateSignals(snapshot, mockSettings, [openOrder]);
            (0, vitest_1.expect)(signal).not.toBeNull();
            (0, vitest_1.expect)(signal === null || signal === void 0 ? void 0 : signal.action).toBe('SELL');
            (0, vitest_1.expect)(signal === null || signal === void 0 ? void 0 : signal.price).toBe(1310000);
        });
        (0, vitest_1.it)('should return HOLD when price is between triggers', function () {
            var signal = strategy_1.StrategyEngine.evaluateSignals(mockSnapshot, mockSettings, []);
            (0, vitest_1.expect)(signal).not.toBeNull();
            (0, vitest_1.expect)(signal === null || signal === void 0 ? void 0 : signal.action).toBe('HOLD');
        });
        (0, vitest_1.it)('should return null when pair is disabled', function () {
            var disabledSettings = __assign(__assign({}, mockSettings), { enabled: false });
            var signal = strategy_1.StrategyEngine.evaluateSignals(mockSnapshot, disabledSettings, []);
            (0, vitest_1.expect)(signal).toBeNull();
        });
        (0, vitest_1.it)('should not generate BUY signal if already have open buy order', function () {
            var snapshot = __assign(__assign({}, mockSnapshot), { lastPrice: 1190000 });
            var openBuyOrder = {
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
            var signal = strategy_1.StrategyEngine.evaluateSignals(snapshot, mockSettings, [openBuyOrder]);
            (0, vitest_1.expect)(signal === null || signal === void 0 ? void 0 : signal.action).toBe('HOLD');
        });
    });
    (0, vitest_1.describe)('calculateQuantity', function () {
        (0, vitest_1.it)('should calculate correct quantity from THB amount', function () {
            var quantity = strategy_1.StrategyEngine.calculateQuantity(5000, 1250000);
            (0, vitest_1.expect)(quantity).toBe(0.004); // 5000 / 1250000
        });
        (0, vitest_1.it)('should round to 8 decimal places', function () {
            var _a;
            var quantity = strategy_1.StrategyEngine.calculateQuantity(1000, 1234567);
            (0, vitest_1.expect)(((_a = quantity.toString().split('.')[1]) === null || _a === void 0 ? void 0 : _a.length) || 0).toBeLessThanOrEqual(8);
        });
    });
    (0, vitest_1.describe)('calculateFee', function () {
        (0, vitest_1.it)('should calculate fee correctly', function () {
            var fee = strategy_1.StrategyEngine.calculateFee(0.004, 1250000, 0.0025);
            (0, vitest_1.expect)(fee).toBe(12.5); // 0.004 * 1250000 * 0.0025 = 12.5
        });
        (0, vitest_1.it)('should handle zero fee rate', function () {
            var fee = strategy_1.StrategyEngine.calculateFee(0.004, 1250000, 0);
            (0, vitest_1.expect)(fee).toBe(0);
        });
    });
});
