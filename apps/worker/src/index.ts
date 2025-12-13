import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import {
  SettingsService,
  BalanceService,
  OrderService,
  EventService,
  EquityService,
  BotStateService
} from './services.js';

// @ts-ignore
import { initializeDatabase, acquireWorkerLock, releaseWorkerLock, StrategyEngine, RiskEngine, MarketSnapshot, Pair, getDatabase } from '@trader-bot/core';
// @ts-ignore
import { BitkubClient } from '@trader-bot/bitkub';

const PAIRS: Pair[] = ['BTC/THB', 'ETH/THB'];
const WORKER_LOCK_ID = 1;
const WORKER_INTERVAL_MS = parseInt(process.env.WORKER_INTERVAL_MS || '2000', 10);

let isRunning = true;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set');
  }

  // Initialize database
  await initializeDatabase(databaseUrl);
  console.log('✓ Database connected');

  // Start worker loop
  while (isRunning) {
    const db = getDatabase();
    const lockAcquired = await acquireWorkerLock(db, WORKER_LOCK_ID);

    if (!lockAcquired) {
      console.log('Could not acquire lock, skipping cycle...');
      await sleep(WORKER_INTERVAL_MS);
      continue;
    }

    try {
      await runWorkerCycle();
      await BotStateService.updatePulse();
    } catch (error) {
      console.error('Worker cycle error:', error);
      await EventService.logEvent('ERROR', `Worker cycle failed: ${error}`, { error });
    } finally {
      await releaseWorkerLock(db, WORKER_LOCK_ID);
      await sleep(WORKER_INTERVAL_MS);
    }
  }
}

async function runWorkerCycle() {
  const botState = await BotStateService.getState();

  // Skip if paused or kill switch is enabled
  if (botState.isPaused || botState.killSwitch) {
    return;
  }

  // Get settings
  const strategySettings = await SettingsService.getStrategySettings();
  const riskLimits = await SettingsService.getRiskLimits();
  const tradingMode = await SettingsService.getTradingMode();
  const feeRate = await SettingsService.getFeeRate();
  const slippage = await SettingsService.getSlippage();

  // Get current balances
  const balances = await BalanceService.getBalance(tradingMode);
  const openOrders = await OrderService.getOpenOrders(tradingMode);

  // Create paper wallet
  // @ts-ignore
  const { PaperWallet } = await import('@trader-bot/paper');
  const wallet = new (PaperWallet as any)(balances, feeRate, slippage);

  // Fetch market data
  const bitkubClient = new BitkubClient();
  const snapshots = new Map<Pair, MarketSnapshot>();

  for (const pair of PAIRS) {
    const ticker = await bitkubClient.getPublic().getTicker(pair);
    if (!ticker) {
      await EventService.logEvent('WARN', `Could not fetch ticker for ${pair}`);
      continue;
    }

    snapshots.set(pair, {
      pair,
      lastPrice: ticker.last,
      bestBid: ticker.highestBid,
      bestAsk: ticker.lowestAsk,
      high24h: ticker.high24hr,
      low24h: ticker.low24hr,
      volume24h: ticker.quoteVolume,
      change24h: ticker.percentChange,
      timestamp: Date.now()
    });
  }

  // Get current day's PnL for risk checks
  const dailyPnL = await EquityService.getDailyPnL(tradingMode, new Date());

  // Process each pair
  for (const pair of PAIRS) {
    const snapshot = snapshots.get(pair);
    if (!snapshot) continue;

    const pairSettings = pair === 'BTC/THB' ? strategySettings.btc : strategySettings.eth;

    // Generate signal
    const signal = StrategyEngine.evaluateSignals(snapshot, pairSettings, openOrders);

    if (!signal || signal.action === 'HOLD') {
      continue;
    }

    // Check risk limits
    const quantity = StrategyEngine.calculateQuantity(pairSettings.orderSizeTHB, snapshot.lastPrice);
    const riskCheck = RiskEngine.checkOrderAllowed(
      signal.action as 'BUY' | 'SELL',
      pair,
      quantity,
      snapshot.lastPrice,
      balances,
      openOrders,
      riskLimits,
      botState.killSwitch,
      dailyPnL
    );

    if (!riskCheck.allowed) {
      await EventService.logEvent('WARN', `Order blocked: ${pair} ${signal.action} - ${riskCheck.reason}`, {
        pair,
        action: signal.action,
        reason: riskCheck.reason
      });
      continue;
    }

    // Place order
    const order = await OrderService.createOrder(tradingMode, pair, signal.action, snapshot.lastPrice, quantity);
    await EventService.logEvent('INFO', `Order placed: ${pair} ${signal.action} @ ${snapshot.lastPrice}`, {
      orderId: order.id,
      pair,
      side: signal.action,
      price: snapshot.lastPrice,
      quantity
    });

    // Simulate fill
    const fillResult = wallet.simulateFill(order, snapshot.bestBid, snapshot.bestAsk, snapshot.lastPrice);

    if (fillResult.filled) {
      wallet.updateBalancesOnFill(order, fillResult.quantity, fillResult.price, fillResult.fee);
      await OrderService.recordFill(order.id, fillResult.quantity, fillResult.price, fillResult.fee);
      await OrderService.updateOrderFill(order.id, 'FILLED', fillResult.quantity, fillResult.price, fillResult.fee);
      await BalanceService.updateBalance(tradingMode, wallet.getBalances());

      await EventService.logEvent('INFO', `Order filled: ${pair} ${signal.action} @ ${fillResult.price}`, {
        orderId: order.id,
        pair,
        side: signal.action,
        price: fillResult.price,
        quantity: fillResult.quantity,
        fee: fillResult.fee
      });
    } else {
      await EventService.logEvent('DEBUG', fillResult.reason, { orderId: order.id });
    }
  }

  // Record equity snapshot
  const btcSnapshot = snapshots.get('BTC/THB');
  const ethSnapshot = snapshots.get('ETH/THB');

  if (btcSnapshot && ethSnapshot) {
    const portfolioValue = wallet.calculatePortfolioValue(btcSnapshot.lastPrice, ethSnapshot.lastPrice);
    await EquityService.recordSnapshot(tradingMode, portfolioValue, wallet.getBalances(), btcSnapshot.lastPrice, ethSnapshot.lastPrice);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  isRunning = false;
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  isRunning = false;
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
