"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyEngine = void 0;
var StrategyEngine = /** @class */ (function () {
    function StrategyEngine() {
    }
    /**
     * Evaluate market conditions and generate signals
     */
    StrategyEngine.evaluateSignals = function (snapshot, settings, openOrders) {
        if (!settings.enabled) {
            return null;
        }
        // Find any open position for this pair
        var openPositions = openOrders.filter(function (o) { return o.status === 'OPEN' || o.status === 'PARTIAL'; });
        // Check if we have an open buy order or already hold asset
        var hasBuyOrder = openPositions.some(function (o) { return o.pair === snapshot.pair && o.side === 'BUY'; });
        var hasSellOrder = openPositions.some(function (o) { return o.pair === snapshot.pair && o.side === 'SELL'; });
        // Simple rule-based strategy: price crosses triggers
        // BUY signal when price drops below buyTrigger (and no open buy)
        if (!hasBuyOrder && snapshot.lastPrice <= settings.buyTrigger) {
            return {
                pair: snapshot.pair,
                action: 'BUY',
                price: snapshot.lastPrice,
                reason: "Price ".concat(snapshot.lastPrice, " <= buyTrigger ").concat(settings.buyTrigger)
            };
        }
        // SELL signal when price rises above sellTrigger (and we have bought)
        // In v1, we check if we've filled a recent buy order
        var recentBuyFills = openPositions.some(function (o) {
            return o.pair === snapshot.pair && o.side === 'BUY' && o.filledQuantity > 0;
        });
        if ((recentBuyFills || hasSellOrder) && snapshot.lastPrice >= settings.sellTrigger) {
            return {
                pair: snapshot.pair,
                action: 'SELL',
                price: snapshot.lastPrice,
                reason: "Price ".concat(snapshot.lastPrice, " >= sellTrigger ").concat(settings.sellTrigger)
            };
        }
        return {
            pair: snapshot.pair,
            action: 'HOLD',
            price: snapshot.lastPrice,
            reason: 'No signal met'
        };
    };
    /**
     * Calculate order quantity from THB amount and price
     */
    StrategyEngine.calculateQuantity = function (orderSizeTHB, price) {
        return parseFloat((orderSizeTHB / price).toFixed(8));
    };
    /**
     * Calculate fee amount
     */
    StrategyEngine.calculateFee = function (quantity, price, feeRate) {
        var totalCost = quantity * price;
        return parseFloat((totalCost * feeRate).toFixed(8));
    };
    return StrategyEngine;
}());
exports.StrategyEngine = StrategyEngine;
