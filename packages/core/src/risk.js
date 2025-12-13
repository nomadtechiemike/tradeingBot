"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskEngine = void 0;
var RiskEngine = /** @class */ (function () {
    function RiskEngine() {
    }
    /**
     * Check if an order is allowed given current state
     */
    RiskEngine.checkOrderAllowed = function (side, pair, quantity, price, balances, openOrders, riskLimits, killSwitch, dailyLoss) {
        // Kill switch blocks everything
        if (killSwitch) {
            return { allowed: false, reason: 'Kill switch is enabled' };
        }
        // Check daily loss limit
        if (dailyLoss <= riskLimits.maxDailyLossTHB) {
            return { allowed: false, reason: "Daily loss ".concat(dailyLoss, " exceeds limit ").concat(riskLimits.maxDailyLossTHB) };
        }
        // Check max open orders
        var openOrderCount = openOrders.filter(function (o) { return o.status === 'OPEN' || o.status === 'PARTIAL'; }).length;
        if (openOrderCount >= riskLimits.maxOpenOrders) {
            return { allowed: false, reason: "Open orders ".concat(openOrderCount, " >= limit ").concat(riskLimits.maxOpenOrders) };
        }
        // Check max THB per trade
        var tradeValue = quantity * price;
        if (tradeValue > riskLimits.maxTHBPerTrade) {
            return { allowed: false, reason: "Trade value ".concat(tradeValue, " > limit ").concat(riskLimits.maxTHBPerTrade) };
        }
        // For BUY orders: check if we have enough THB
        if (side === 'BUY') {
            var totalBuyValue = quantity * price;
            if (balances.thb < totalBuyValue) {
                return { allowed: false, reason: "Insufficient THB: have ".concat(balances.thb, ", need ").concat(totalBuyValue) };
            }
            // Check max exposure per pair
            var pairExposure = this.calculatePairExposure(pair, 'BUY', quantity, price, openOrders, balances);
            if (pairExposure > riskLimits.maxExposureTHBPerPair) {
                return {
                    allowed: false,
                    reason: "Pair exposure ".concat(pairExposure, " > limit ").concat(riskLimits.maxExposureTHBPerPair)
                };
            }
        }
        // For SELL orders: check if we have enough asset
        if (side === 'SELL') {
            var asset = pair === 'BTC/THB' ? balances.btc : balances.eth;
            if (asset < quantity) {
                return { allowed: false, reason: "Insufficient ".concat(pair.split('/')[0], ": have ").concat(asset, ", need ").concat(quantity) };
            }
        }
        return { allowed: true };
    };
    /**
     * Calculate current exposure for a pair in THB
     */
    RiskEngine.calculatePairExposure = function (pair, side, newQuantity, newPrice, openOrders, balances) {
        var exposure = 0;
        // Add value from open positions
        var openPositions = openOrders.filter(function (o) { return o.pair === pair && (o.status === 'OPEN' || o.status === 'PARTIAL'); });
        for (var _i = 0, openPositions_1 = openPositions; _i < openPositions_1.length; _i++) {
            var order = openPositions_1[_i];
            if (order.side === 'BUY') {
                exposure += order.filledQuantity * (order.filledPrice || order.price);
            }
        }
        // Add new order
        if (side === 'BUY') {
            exposure += newQuantity * newPrice;
        }
        return exposure;
    };
    /**
     * Calculate PnL for a closed position
     */
    RiskEngine.calculatePnL = function (buyPrice, sellPrice, quantity, fees) {
        var grossProfit = (sellPrice - buyPrice) * quantity;
        return grossProfit - fees;
    };
    /**
     * Calculate daily loss from today's equity change
     */
    RiskEngine.calculateDailyLoss = function (startBalance, currentBalance) {
        return currentBalance - startBalance;
    };
    return RiskEngine;
}());
exports.RiskEngine = RiskEngine;
