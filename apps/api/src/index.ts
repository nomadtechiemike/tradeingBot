import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
// @ts-ignore
import { initializeDatabase } from '@trader-bot/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const API_PORT = parseInt(process.env.API_PORT || '3000', 10);
const API_HOST = process.env.API_HOST || '0.0.0.0';
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'changeme';
const API_SECRET_KEY = process.env.API_SECRET_KEY || 'your-secret-key';

interface AuthPayload {
  username: string;
  password: string;
}

async function start() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set');
  }

  // Initialize database
  await initializeDatabase(databaseUrl);
  console.log('✓ Database connected');

  // Load services dynamically
  // @ts-ignore
  const { SettingsService, BalanceService, OrderService, EventService, EquityService, BotStateService } = await import('../../worker/dist/services.js');

  const fastify = Fastify({
    logger: true
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true,
    credentials: true
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes'
  });

  // Session middleware (simple JWT alternative)
  const sessionStore = new Map<string, { username: string; expires: number }>();

  const generateSessionToken = (username: string): string => {
    // Simple token generation (in production, use JWT)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    sessionStore.set(token, { username, expires: Date.now() + 24 * 60 * 60 * 1000 });
    return token;
  };

  const validateSession = (token: string | undefined): boolean => {
    if (!token) return false;
    const session = sessionStore.get(token);
    if (!session || session.expires < Date.now()) {
      sessionStore.delete(token);
      return false;
    }
    return true;
  };

  // Auth guard
  const authGuard = async (request: any, reply: any) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!validateSession(token)) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  };

  // ============ Auth Routes ============

  fastify.post<{ Body: AuthPayload }>('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body;

    if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = generateSessionToken(username);
    return { token, username };
  });

  fastify.post('/api/auth/logout', async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (token) {
      sessionStore.delete(token);
    }
    return { ok: true };
  });

  // ============ Bot Status Routes ============

  fastify.get('/api/bot/status', { preHandler: [authGuard] }, async (request, reply) => {
    const botState = await BotStateService.getState();
    return botState;
  });

  fastify.post('/api/bot/start', { preHandler: [authGuard] }, async (request, reply) => {
    await BotStateService.setState(true);
    return { ok: true };
  });

  fastify.post('/api/bot/stop', { preHandler: [authGuard] }, async (request, reply) => {
    await BotStateService.setState(false);
    return { ok: true };
  });

  fastify.post('/api/bot/pause', { preHandler: [authGuard] }, async (request, reply) => {
    await BotStateService.setPaused(true);
    return { ok: true };
  });

  fastify.post('/api/bot/resume', { preHandler: [authGuard] }, async (request, reply) => {
    await BotStateService.setPaused(false);
    return { ok: true };
  });

  fastify.post('/api/bot/kill-switch/:enabled', { preHandler: [authGuard] }, async (request: any, reply) => {
    const enabled = request.params.enabled === 'true';
    await BotStateService.setKillSwitch(enabled);
    return { ok: true };
  });

  // ============ Settings Routes ============

  fastify.get('/api/settings/strategy', { preHandler: [authGuard] }, async (request, reply) => {
    return await SettingsService.getStrategySettings();
  });

  fastify.put('/api/settings/strategy/:pair', { preHandler: [authGuard] }, async (request: any, reply) => {
    const { pair } = request.params;
    const settings = request.body;

    const key = pair.toLowerCase() === 'btc' ? 'strategy_btc' : 'strategy_eth';
    await SettingsService.set(key, settings);

    return { ok: true };
  });

  fastify.get('/api/settings/risk', { preHandler: [authGuard] }, async (request, reply) => {
    return await SettingsService.getRiskLimits();
  });

  fastify.put('/api/settings/risk', { preHandler: [authGuard] }, async (request, reply) => {
    await SettingsService.set('risk_limits', request.body);
    return { ok: true };
  });

  fastify.get('/api/settings/mode', { preHandler: [authGuard] }, async (request, reply) => {
    const mode = await SettingsService.getTradingMode();
    return { mode };
  });

  fastify.put('/api/settings/mode', { preHandler: [authGuard] }, async (request: any, reply) => {
    const { mode } = request.body;
    if (mode !== 'PAPER' && mode !== 'LIVE') {
      return reply.code(400).send({ error: 'Invalid mode' });
    }
    await SettingsService.set('trading_mode', mode);
    return { ok: true };
  });

  // ============ Balance Routes ============

  fastify.get('/api/balances', { preHandler: [authGuard] }, async (request: any, reply) => {
    const mode = (request.query.mode as string) || 'PAPER';
    const balances = await BalanceService.getBalance(mode as any);
    return balances;
  });

  // ============ Orders Routes ============

  fastify.get('/api/orders/open', { preHandler: [authGuard] }, async (request: any, reply) => {
    const mode = (request.query.mode as string) || 'PAPER';
    return await OrderService.getOpenOrders(mode as any);
  });

  fastify.get('/api/orders', { preHandler: [authGuard] }, async (request: any, reply) => {
    // Return recent orders
    const limit = parseInt((request.query.limit as string) || '100', 10);
    // Would need a method to get all orders with limit in OrderService
    return [];
  });

  fastify.get('/api/fills', { preHandler: [authGuard] }, async (request: any, reply) => {
    const limit = parseInt((request.query.limit as string) || '100', 10);
    return await OrderService.getRecentFills(limit);
  });

  // ============ Equity Routes ============

  fastify.get('/api/equity/daily-pnl', { preHandler: [authGuard] }, async (request: any, reply) => {
    const mode = (request.query.mode as string) || 'PAPER';
    const dailyPnL = await EquityService.getDailyPnL(mode as any, new Date());
    return { dailyPnL };
  });

  fastify.get('/api/equity/latest', { preHandler: [authGuard] }, async (request: any, reply) => {
    const mode = (request.query.mode as string) || 'PAPER';
    const snapshot = await EquityService.getLatestSnapshot(mode as any);
    return snapshot || { error: 'No data' };
  });

  // ============ Events Routes ============

  fastify.get('/api/events', { preHandler: [authGuard] }, async (request: any, reply) => {
    const limit = parseInt((request.query.limit as string) || '100', 10);
    const level = (request.query.level as string) || undefined;
    return await EventService.getRecentEvents(limit, level);
  });

  // ============ Market Data ============

  fastify.get('/api/markets', async (request, reply) => {
    try {
      // @ts-ignore
      const { BitkubClient } = await import('@trader-bot/bitkub');
      const client = new BitkubClient();
      const publicClient = client.getPublic();
      
      const btc = await publicClient.getTicker('THB_BTC');
      const eth = await publicClient.getTicker('THB_ETH');
      
      return {
        'BTC/THB': btc,
        'ETH/THB': eth
      };
    } catch (error) {
      console.error('Error fetching markets:', error);
      return reply.code(500).send({ error: 'Failed to fetch market data' });
    }
  });

  // ============ Health Check ============

  fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  // Serve Vue app
  const publicPath = path.join(__dirname, '../../web/dist');
  try {
    await fastify.register(staticPlugin, {
      root: publicPath,
      prefix: '/'
    });

    // SPA fallback
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  } catch (err) {
    console.log('Web dist not found yet, skipping static serve');
  }

  await fastify.listen({ port: API_PORT, host: API_HOST });
  console.log(`✓ API server listening on http://${API_HOST}:${API_PORT}`);
}

start().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
