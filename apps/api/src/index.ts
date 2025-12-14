import Fastify from 'fastify';
import dotenv from 'dotenv';
import { migrate } from './migrations';
import { Pool } from 'pg';
import cookie from 'fastify-cookie';
import rateLimit from 'fastify-rate-limit';
import fetch from 'node-fetch';

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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/api/src/index.ts:53',message:'Kill switch called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  await pool.query("INSERT INTO bot_events(level,message,meta) VALUES('WARN','KILL_SWITCH','{}'::jsonb)");
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/api/src/index.ts:56',message:'Kill switch SQL executed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  return { ok:true };
});

const start = async ()=>{
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/api/src/index.ts:64',message:'API starting',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    await migrate();
    const port = Number(process.env.API_PORT || 3000);
    await server.listen({ port, host: process.env.API_HOST || '0.0.0.0' });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/api/src/index.ts:68',message:'API started successfully',data:{port},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/api/src/index.ts:71',message:'API startup failed',data:{error:String(err),stack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.error('API startup error:', err);
    throw err;
  }
};

start().catch(err=>{console.error(err); process.exit(1);});
