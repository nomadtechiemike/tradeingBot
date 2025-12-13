import Fastify from 'fastify';
import dotenv from 'dotenv';
import { migrate } from './migrations';
import { Pool } from 'pg';
import cookie from 'fastify-cookie';
import rateLimit from 'fastify-rate-limit';

dotenv.config();
const server = Fastify({ logger: true });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

server.register(cookie as any);
server.register(rateLimit as any, { max: 50, timeWindow: '1 minute' });

// basic auth route (very simple)
server.post('/api/login', async (req:any, reply:any)=>{
  const body = req.body || {};
  if (body.username===process.env.AUTH_USERNAME && body.password===process.env.AUTH_PASSWORD) {
    reply.setCookie('session', '1', { path: '/', httpOnly: true });
    return { ok: true };
  }
  reply.code(401);
  return { ok: false };
});

server.get('/api/status', async ()=>{
  const r = await pool.query('SELECT * FROM balances ORDER BY id DESC LIMIT 1');
  const balances = r.rows[0] || { thb:0, btc:0, eth:0 };
  return { ok:true, balances };
});

server.get('/api/settings', async ()=>{
  const r = await pool.query("SELECT value FROM settings WHERE key='strategy'");
  return { strategy: r.rows[0]?.value };
});

server.post('/api/settings', async (req:any)=>{
  const body = req.body;
  await pool.query("INSERT INTO settings(key,value) VALUES('strategy',$1) ON CONFLICT (key) DO UPDATE SET value=$1", [body]);
  return { ok:true };
});

server.get('/api/orders', async ()=>{
  const r = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');
  return r.rows;
});

server.get('/api/fills', async ()=>{
  const r = await pool.query('SELECT * FROM fills ORDER BY created_at DESC LIMIT 100');
  return r.rows;
});

server.post('/api/kill', async ()=>{
  await pool.query("INSERT INTO bot_events(level,message) VALUES('WARN','KILL_SWITCH','{}')");
  return { ok:true };
});

const start = async ()=>{
  await migrate();
  const port = Number(process.env.API_PORT || 3000);
  await server.listen({ port, host: process.env.API_HOST || '0.0.0.0' });
};

start().catch(err=>{console.error(err); process.exit(1);});
