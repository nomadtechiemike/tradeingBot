import { getDatabase, schema } from '@trader-bot/core';
import { Balances, Order, BotState, PairStrategySettings, RiskLimits, TradingMode } from '@trader-bot/core';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export class SettingsService {
  /**
   * Get a setting by key
   */
  static async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, key))
      .limit(1);

    if (result.length === 0) {
      return defaultValue as T;
    }

    return result[0].value as T;
  }

  /**
   * Set a setting
   */
  static async set(key: string, value: any): Promise<void> {
    const db = getDatabase();
    const existing = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, key))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.settings).values({
        key,
        value
      });
    } else {
      await db
        .update(schema.settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(schema.settings.key, key));
    }
  }

  /**
   * Get all strategy settings
   */
  static async getStrategySettings(): Promise<{ btc: PairStrategySettings; eth: PairStrategySettings }> {
    const btcSettings = await this.get<PairStrategySettings>('strategy_btc', {
      enabled: true,
      buyTrigger: 1200000,
      sellTrigger: 1300000,
      orderSizeTHB: 5000
    });

    const ethSettings = await this.get<PairStrategySettings>('strategy_eth', {
      enabled: true,
      buyTrigger: 30000,
      sellTrigger: 35000,
      orderSizeTHB: 3000
    });

    return { btc: btcSettings, eth: ethSettings };
  }

  /**
   * Get all risk limits
   */
  static async getRiskLimits(): Promise<RiskLimits> {
    return this.get<RiskLimits>('risk_limits', {
      maxTHBPerTrade: 10000,
      maxExposureTHBPerPair: 50000,
      maxOpenOrders: 5,
      maxDailyLossTHB: -20000
    });
  }

  /**
   * Get trading mode
   */
  static async getTradingMode(): Promise<TradingMode> {
    return this.get<TradingMode>('trading_mode', 'PAPER');
  }

  /**
   * Get fee rate for paper trading
   */
  static async getFeeRate(): Promise<number> {
    return this.get<number>('fee_rate', 0.0025);
  }

  /**
   * Get slippage for paper trading
   */
  static async getSlippage(): Promise<number> {
    return this.get<number>('slippage', 0);
  }
}

export class BalanceService {
  /**
   * Get current balances
   */
  static async getBalance(mode: TradingMode = 'PAPER'): Promise<Balances> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.balances)
      .where(eq(schema.balances.mode, mode))
      .limit(1);

    if (result.length === 0) {
      // Initialize with defaults
      const defaultBalance = {
        thb: 20000,
        btc: 0,
        eth: 0
      };
      await db.insert(schema.balances).values({
        mode,
        thb: '20000',
        btc: '0',
        eth: '0'
      });
      return defaultBalance;
    }

    return {
      thb: parseFloat(result[0].thb),
      btc: parseFloat(result[0].btc),
      eth: parseFloat(result[0].eth)
    };
  }

  /**
   * Update balances
   */
  static async updateBalance(mode: TradingMode, balances: Balances): Promise<void> {
    const db = getDatabase();
    await db
      .update(schema.balances)
      .set({
        thb: balances.thb.toString(),
        btc: balances.btc.toString(),
        eth: balances.eth.toString(),
        updatedAt: new Date()
      })
      .where(eq(schema.balances.mode, mode));
  }
}

export class OrderService {
  /**
   * Create an order
   */
  static async createOrder(
    mode: TradingMode,
    pair: string,
    side: 'BUY' | 'SELL',
    price: number,
    quantity: number
  ): Promise<Order> {
    const db = getDatabase();
    const [result] = await db
      .insert(schema.orders)
      .values({
        mode,
        pair,
        side,
        price: price.toString(),
        quantity: quantity.toString(),
        status: 'OPEN',
        filledQuantity: '0',
        fee: '0'
      })
      .returning();

    return this.rowToOrder(result);
  }

  /**
   * Get open orders
   */
  static async getOpenOrders(mode?: TradingMode): Promise<Order[]> {
    const db = getDatabase();
    let query = db
      .select()
      .from(schema.orders)
      .where(
        and(
          or(
            eq(schema.orders.status, 'OPEN'),
            eq(schema.orders.status, 'PARTIAL')
          ),
          ...(mode ? [eq(schema.orders.mode, mode)] : [])
        )
      );

    const results = await query;
    return results.map((r) => this.rowToOrder(r));
  }

  /**
   * Get order by ID
   */
  static async getOrderById(id: number): Promise<Order | null> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    return result.length > 0 ? this.rowToOrder(result[0]) : null;
  }

  /**
   * Update order status and fill info
   */
  static async updateOrderFill(
    orderId: number,
    status: 'FILLED' | 'PARTIAL' | 'CANCELLED',
    filledQuantity: number,
    filledPrice: number,
    fee: number
  ): Promise<void> {
    const db = getDatabase();
    await db
      .update(schema.orders)
      .set({
        status,
        filledQuantity: filledQuantity.toString(),
        filledPrice: filledPrice.toString(),
        fee: fee.toString(),
        updatedAt: new Date()
      })
      .where(eq(schema.orders.id, orderId));
  }

  /**
   * Record a fill
   */
  static async recordFill(orderId: number, quantity: number, price: number, fee: number): Promise<void> {
    const db = getDatabase();
    await db.insert(schema.fills).values({
      orderId,
      quantity: quantity.toString(),
      price: price.toString(),
      fee: fee.toString()
    });
  }

  /**
   * Get recent fills
   */
  static async getRecentFills(limit: number = 100): Promise<any[]> {
    const db = getDatabase();
    return db
      .select()
      .from(schema.fills)
      .orderBy(desc(schema.fills.createdAt))
      .limit(limit);
  }

  private static rowToOrder(row: any): Order {
    return {
      id: row.id,
      mode: row.mode,
      pair: row.pair,
      side: row.side,
      price: parseFloat(row.price),
      quantity: parseFloat(row.quantity),
      status: row.status,
      filledQuantity: parseFloat(row.filledQuantity || 0),
      filledPrice: row.filledPrice ? parseFloat(row.filledPrice) : undefined,
      fee: parseFloat(row.fee || 0),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}

export class EventService {
  /**
   * Log an event
   */
  static async logEvent(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, meta?: any): Promise<void> {
    const db = getDatabase();
    await db.insert(schema.botEvents).values({
      level,
      message,
      meta
    });
  }

  /**
   * Get recent events
   */
  static async getRecentEvents(limit: number = 100, level?: string): Promise<any[]> {
    const db = getDatabase();
    let query: any = db.select().from(schema.botEvents);

    if (level) {
      query = query.where(eq(schema.botEvents.level, level));
    }

    return query.orderBy(desc(schema.botEvents.timestamp)).limit(limit);
  }
}

export class EquityService {
  /**
   * Record equity snapshot
   */
  static async recordSnapshot(
    mode: TradingMode,
    totalValueTHB: number,
    balances: Balances,
    btcPrice: number,
    ethPrice: number
  ): Promise<void> {
    const db = getDatabase();
    await db.insert(schema.equitySnapshots).values({
      mode,
      totalValueTHB: totalValueTHB.toString(),
      thb: balances.thb.toString(),
      btc: balances.btc.toString(),
      eth: balances.eth.toString(),
      btcPriceTHB: btcPrice.toString(),
      ethPriceTHB: ethPrice.toString()
    });
  }

  /**
   * Get daily PnL
   */
  static async getDailyPnL(mode: TradingMode, date: Date): Promise<number> {
    const db = getDatabase();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshots = await db
      .select()
      .from(schema.equitySnapshots)
      .where(
        and(
          eq(schema.equitySnapshots.mode, mode),
          gte(schema.equitySnapshots.timestamp, startOfDay),
          lte(schema.equitySnapshots.timestamp, endOfDay)
        )
      )
      .orderBy(schema.equitySnapshots.timestamp);

    if (snapshots.length < 2) {
      return 0;
    }

    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];

    return parseFloat(lastSnapshot.totalValueTHB) - parseFloat(firstSnapshot.totalValueTHB);
  }

  /**
   * Get latest snapshot
   */
  static async getLatestSnapshot(mode: TradingMode): Promise<any | null> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.equitySnapshots)
      .where(eq(schema.equitySnapshots.mode, mode))
      .orderBy(desc(schema.equitySnapshots.timestamp))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }
}

export class BotStateService {
  /**
   * Initialize or get bot state
   */
  static async getState(): Promise<BotState> {
    const db = getDatabase();
    let result = await db.select().from(schema.botState).limit(1);

    if (result.length === 0) {
      await db.insert(schema.botState).values({
        isRunning: false,
        isPaused: false,
        killSwitch: false
      });
      result = await db.select().from(schema.botState).limit(1);
    }

    const state = result[0];
    return {
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      killSwitch: state.killSwitch,
      lastPulseAt: state.lastPulseAt || undefined
    };
  }

  /**
   * Update bot running state
   */
  static async setState(isRunning: boolean): Promise<void> {
    const db = getDatabase();
    await db
      .update(schema.botState)
      .set({
        isRunning,
        updatedAt: new Date()
      })
      .where(eq(schema.botState.id, 1));
  }

  /**
   * Update pause state
   */
  static async setPaused(isPaused: boolean): Promise<void> {
    const db = getDatabase();
    await db
      .update(schema.botState)
      .set({
        isPaused,
        updatedAt: new Date()
      })
      .where(eq(schema.botState.id, 1));
  }

  /**
   * Update kill switch
   */
  static async setKillSwitch(enabled: boolean): Promise<void> {
    const db = getDatabase();
    await db
      .update(schema.botState)
      .set({
        killSwitch: enabled,
        updatedAt: new Date()
      })
      .where(eq(schema.botState.id, 1));
  }

  /**
   * Update last pulse timestamp
   */
  static async updatePulse(): Promise<void> {
    const db = getDatabase();
    await db
      .update(schema.botState)
      .set({
        lastPulseAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.botState.id, 1));
  }
}

// Helper function
function or(...conditions: any[]): any {
  return conditions[0];
}
