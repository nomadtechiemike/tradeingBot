"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.botState = exports.botEvents = exports.equitySnapshots = exports.fills = exports.orders = exports.balances = exports.settings = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
// Settings table - single row or keyed records
exports.settings = (0, pg_core_1.pgTable)('settings', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    key: (0, pg_core_1.varchar)('key', { length: 255 }).notNull(),
    value: (0, pg_core_1.jsonb)('value').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').default((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))).notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').default((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))).notNull(),
}, function (table) { return ({
    keyIdx: (0, pg_core_1.uniqueIndex)('settings_key_idx').on(table.key),
}); });
// Paper balances
exports.balances = (0, pg_core_1.pgTable)('balances', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    mode: (0, pg_core_1.varchar)('mode', { length: 50 }).default('PAPER').notNull(), // PAPER or LIVE
    thb: (0, pg_core_1.numeric)('thb', { precision: 20, scale: 8 }).default('20000').notNull(),
    btc: (0, pg_core_1.numeric)('btc', { precision: 20, scale: 8 }).default('0').notNull(),
    eth: (0, pg_core_1.numeric)('eth', { precision: 20, scale: 8 }).default('0').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').default((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))).notNull(),
}, function (table) { return ({
    modeIdx: (0, pg_core_1.uniqueIndex)('balances_mode_idx').on(table.mode),
}); });
// Orders
exports.orders = (0, pg_core_1.pgTable)('orders', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    mode: (0, pg_core_1.varchar)('mode', { length: 50 }).default('PAPER').notNull(), // PAPER or LIVE
    pair: (0, pg_core_1.varchar)('pair', { length: 20 }).notNull(), // BTC/THB or ETH/THB
    side: (0, pg_core_1.varchar)('side', { length: 10 }).notNull(), // BUY or SELL
    price: (0, pg_core_1.numeric)('price', { precision: 20, scale: 8 }).notNull(),
    quantity: (0, pg_core_1.numeric)('quantity', { precision: 20, scale: 8 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('OPEN').notNull(), // OPEN, FILLED, CANCELLED, PARTIAL
    filledQuantity: (0, pg_core_1.numeric)('filled_quantity', { precision: 20, scale: 8 }).default('0').notNull(),
    filledPrice: (0, pg_core_1.numeric)('filled_price', { precision: 20, scale: 8 }), // avg fill price
    fee: (0, pg_core_1.numeric)('fee', { precision: 20, scale: 8 }).default('0'),
    createdAt: (0, pg_core_1.timestamp)('created_at').default((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))).notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').default((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))).notNull(),
}, function (table) { return ({
    pairIdx: (0, pg_core_1.index)('orders_pair_idx').on(table.pair),
    statusIdx: (0, pg_core_1.index)('orders_status_idx').on(table.status),
    createdAtIdx: (0, pg_core_1.index)('orders_created_at_idx').on(table.createdAt),
}); });
// Fills
exports.fills = (0, pg_core_1.pgTable)('fills', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    orderId: (0, pg_core_1.serial)('order_id').notNull(),
    price: (0, pg_core_1.numeric)('price', { precision: 20, scale: 8 }).notNull(),
    quantity: (0, pg_core_1.numeric)('quantity', { precision: 20, scale: 8 }).notNull(),
    fee: (0, pg_core_1.numeric)('fee', { precision: 20, scale: 8 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').default((0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))).notNull(),
}, function (table) { return ({
    orderIdIdx: (0, pg_core_1.index)('fills_order_id_idx').on(table.orderId),
    createdAtIdx: (0, pg_core_1.index)('fills_created_at_idx').on(table.createdAt),
}); });
// Equity snapshots - for PnL tracking
exports.equitySnapshots = (0, pg_core_1.pgTable)('equity_snapshots', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    mode: (0, pg_core_1.varchar)('mode', { length: 50 }).default('PAPER').notNull(),
    timestamp: (0, pg_core_1.timestamp)('timestamp').default((0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))).notNull(),
    totalValueTHB: (0, pg_core_1.numeric)('total_value_thb', { precision: 20, scale: 8 }).notNull(),
    thb: (0, pg_core_1.numeric)('thb', { precision: 20, scale: 8 }).notNull(),
    btc: (0, pg_core_1.numeric)('btc', { precision: 20, scale: 8 }).notNull(),
    eth: (0, pg_core_1.numeric)('eth', { precision: 20, scale: 8 }).notNull(),
    btcPriceTHB: (0, pg_core_1.numeric)('btc_price_thb', { precision: 20, scale: 8 }),
    ethPriceTHB: (0, pg_core_1.numeric)('eth_price_thb', { precision: 20, scale: 8 }),
}, function (table) { return ({
    timestampIdx: (0, pg_core_1.index)('equity_snapshots_timestamp_idx').on(table.timestamp),
    modeIdx: (0, pg_core_1.index)('equity_snapshots_mode_idx').on(table.mode),
}); });
// Bot events - trading decisions, errors, etc
exports.botEvents = (0, pg_core_1.pgTable)('bot_events', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    timestamp: (0, pg_core_1.timestamp)('timestamp').default((0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))).notNull(),
    level: (0, pg_core_1.varchar)('level', { length: 20 }).notNull(), // INFO, WARN, ERROR, DEBUG
    message: (0, pg_core_1.text)('message').notNull(),
    meta: (0, pg_core_1.jsonb)('meta'), // additional context
}, function (table) { return ({
    timestampIdx: (0, pg_core_1.index)('bot_events_timestamp_idx').on(table.timestamp),
    levelIdx: (0, pg_core_1.index)('bot_events_level_idx').on(table.level),
}); });
// Bot state - for worker locking and status
exports.botState = (0, pg_core_1.pgTable)('bot_state', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    isRunning: (0, pg_core_1.boolean)('is_running').default(false).notNull(),
    isPaused: (0, pg_core_1.boolean)('is_paused').default(false).notNull(),
    killSwitch: (0, pg_core_1.boolean)('kill_switch').default(false).notNull(),
    lastPulseAt: (0, pg_core_1.timestamp)('last_pulse_at'),
    workerLock: (0, pg_core_1.timestamp)('worker_lock'), // advisory lock expiry
    updatedAt: (0, pg_core_1.timestamp)('updated_at').default((0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))).notNull(),
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
