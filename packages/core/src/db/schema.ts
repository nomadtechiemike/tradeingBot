import {
  pgTable,
  serial,
  varchar,
  numeric,
  timestamp,
  boolean,
  text,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Settings table - single row or keyed records
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull(),
  value: jsonb('value').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  keyIdx: uniqueIndex('settings_key_idx').on(table.key),
}));

// Paper balances
export const balances = pgTable('balances', {
  id: serial('id').primaryKey(),
  mode: varchar('mode', { length: 50 }).default('PAPER').notNull(), // PAPER or LIVE
  thb: numeric('thb', { precision: 20, scale: 8 }).default('20000').notNull(),
  btc: numeric('btc', { precision: 20, scale: 8 }).default('0').notNull(),
  eth: numeric('eth', { precision: 20, scale: 8 }).default('0').notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  modeIdx: uniqueIndex('balances_mode_idx').on(table.mode),
}));

// Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  mode: varchar('mode', { length: 50 }).default('PAPER').notNull(), // PAPER or LIVE
  pair: varchar('pair', { length: 20 }).notNull(), // BTC/THB or ETH/THB
  side: varchar('side', { length: 10 }).notNull(), // BUY or SELL
  price: numeric('price', { precision: 20, scale: 8 }).notNull(),
  quantity: numeric('quantity', { precision: 20, scale: 8 }).notNull(),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(), // OPEN, FILLED, CANCELLED, PARTIAL
  filledQuantity: numeric('filled_quantity', { precision: 20, scale: 8 }).default('0').notNull(),
  filledPrice: numeric('filled_price', { precision: 20, scale: 8 }), // avg fill price
  fee: numeric('fee', { precision: 20, scale: 8 }).default('0'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  pairIdx: index('orders_pair_idx').on(table.pair),
  statusIdx: index('orders_status_idx').on(table.status),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
}));

// Fills
export const fills = pgTable('fills', {
  id: serial('id').primaryKey(),
  orderId: serial('order_id').notNull(),
  price: numeric('price', { precision: 20, scale: 8 }).notNull(),
  quantity: numeric('quantity', { precision: 20, scale: 8 }).notNull(),
  fee: numeric('fee', { precision: 20, scale: 8 }).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  orderIdIdx: index('fills_order_id_idx').on(table.orderId),
  createdAtIdx: index('fills_created_at_idx').on(table.createdAt),
}));

// Equity snapshots - for PnL tracking
export const equitySnapshots = pgTable('equity_snapshots', {
  id: serial('id').primaryKey(),
  mode: varchar('mode', { length: 50 }).default('PAPER').notNull(),
  timestamp: timestamp('timestamp').default(sql`CURRENT_TIMESTAMP`).notNull(),
  totalValueTHB: numeric('total_value_thb', { precision: 20, scale: 8 }).notNull(),
  thb: numeric('thb', { precision: 20, scale: 8 }).notNull(),
  btc: numeric('btc', { precision: 20, scale: 8 }).notNull(),
  eth: numeric('eth', { precision: 20, scale: 8 }).notNull(),
  btcPriceTHB: numeric('btc_price_thb', { precision: 20, scale: 8 }),
  ethPriceTHB: numeric('eth_price_thb', { precision: 20, scale: 8 }),
}, (table) => ({
  timestampIdx: index('equity_snapshots_timestamp_idx').on(table.timestamp),
  modeIdx: index('equity_snapshots_mode_idx').on(table.mode),
}));

// Bot events - trading decisions, errors, etc
export const botEvents = pgTable('bot_events', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').default(sql`CURRENT_TIMESTAMP`).notNull(),
  level: varchar('level', { length: 20 }).notNull(), // INFO, WARN, ERROR, DEBUG
  message: text('message').notNull(),
  meta: jsonb('meta'), // additional context
}, (table) => ({
  timestampIdx: index('bot_events_timestamp_idx').on(table.timestamp),
  levelIdx: index('bot_events_level_idx').on(table.level),
}));

// Bot state - for worker locking and status
export const botState = pgTable('bot_state', {
  id: serial('id').primaryKey(),
  isRunning: boolean('is_running').default(false).notNull(),
  isPaused: boolean('is_paused').default(false).notNull(),
  killSwitch: boolean('kill_switch').default(false).notNull(),
  lastPulseAt: timestamp('last_pulse_at'),
  workerLock: timestamp('worker_lock'), // advisory lock expiry
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
