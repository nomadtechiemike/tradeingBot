import dotenv from 'dotenv';
import { Pool } from 'pg';
import fetch from 'node-fetch';
import { query as coreQuery } from '@trader-bot/core';
import { fetchTicker } from '@trader-bot/bitkub';

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// #region agent log
fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/worker/src/index.ts:9',message:'Worker imports successful',data:{hasCoreQuery:typeof coreQuery==='function',hasFetchTicker:typeof fetchTicker==='function'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
// #endregion

let running = true;

async function getSettings() {
  const r = await pool.query("SELECT value FROM settings WHERE key='strategy'");
  return r.rows[0]?.value;
}

async function getRisk() {
  const r = await pool.query("SELECT value FROM settings WHERE key='risk'");
  return r.rows[0]?.value;
}

async function loop() {
  const interval = Number(process.env.WORKER_INTERVAL_MS || 2000);
  while(running) {
    try {
      const settings = await getSettings();
      const risk = await getRisk();
      for (const pair of ['BTC/THB','ETH/THB']) {
        const ticker = await fetchTicker(pair);
        const s = settings[pair];
        if (!s || !s.enabled) continue;
        // simple strategy: if last <= buyTrigger -> place buy
        const last = ticker.last;
        // check existing open orders
        const openRes = await pool.query('SELECT sum(quantity*price) as exposure FROM orders WHERE pair=$1 AND status=$2', [pair,'OPEN']);
        const exposure = Number(openRes.rows[0]?.exposure||0);
        if (last <= s.buyTrigger && exposure < (risk.maxExposureTHBPerPair||50000)) {
          // place limit buy at last price
          await pool.query('INSERT INTO orders(mode,pair,side,price,quantity,status) VALUES($1,$2,$3,$4,$5,$6)', ['PAPER',pair,'BUY',last, (s.orderSizeTHB/last), 'OPEN']);
          await pool.query('INSERT INTO bot_events(level,message) VALUES($1,$2)', ['INFO', `Placed BUY ${pair} @ ${last}`]);
        }
        // check holdings
        const bal = await pool.query('SELECT btc,eth FROM balances ORDER BY id DESC LIMIT 1');
        const holdings = bal.rows[0] || { btc:0, eth:0 };
        const assetQty = pair.startsWith('BTC')? Number(holdings.btc):Number(holdings.eth);
        if (assetQty>0 && last >= s.sellTrigger) {
          await pool.query('INSERT INTO orders(mode,pair,side,price,quantity,status) VALUES($1,$2,$3,$4,$5,$6)', ['PAPER',pair,'SELL',last, assetQty, 'OPEN']);
          await pool.query('INSERT INTO bot_events(level,message) VALUES($1,$2)', ['INFO', `Placed SELL ${pair} @ ${last}`]);
        }
        // attempt to fill open orders (naive)
        const opens = await pool.query('SELECT * FROM orders WHERE pair=$1 AND status=$2', [pair,'OPEN']);
        for (const o of opens.rows) {
          if (o.side==='BUY') {
            if (ticker.bestAsk <= Number(o.price)) {
              // fill
              await pool.query('INSERT INTO fills(order_id,price,quantity,fee) VALUES($1,$2,$3,$4)', [o.id, o.price, o.quantity, Number(process.env.PAPER_FEE_RATE || 0.0025) * o.price * o.quantity]);
              await pool.query('UPDATE orders SET status=$1 WHERE id=$2', ['FILLED', o.id]);
              // update balances
              const b = await pool.query('SELECT * FROM balances ORDER BY id DESC LIMIT 1');
              const cur = b.rows[0];
              const thb = Number(cur.thb) - Number(o.price)*Number(o.quantity);
              const isBTC = o.pair.startsWith('BTC');
              const newBtc = isBTC ? Number(cur.btc) + Number(o.quantity) : Number(cur.btc);
              const newEth = isBTC ? Number(cur.eth) : Number(cur.eth) + Number(o.quantity);
              await pool.query('INSERT INTO balances(mode,thb,btc,eth) VALUES($1,$2,$3,$4)', ['PAPER', thb, newBtc, newEth]);
            }
          } else {
            if (ticker.bestBid >= Number(o.price)) {
              await pool.query('INSERT INTO fills(order_id,price,quantity,fee) VALUES($1,$2,$3,$4)', [o.id, o.price, o.quantity, Number(process.env.PAPER_FEE_RATE || 0.0025) * o.price * o.quantity]);
              await pool.query('UPDATE orders SET status=$1 WHERE id=$2', ['FILLED', o.id]);
              const b = await pool.query('SELECT * FROM balances ORDER BY id DESC LIMIT 1');
              const cur = b.rows[0];
              const thb = Number(cur.thb) + Number(o.price)*Number(o.quantity);
              const isBTC = o.pair.startsWith('BTC');
              const newBtc = isBTC ? Number(cur.btc) - Number(o.quantity) : Number(cur.btc);
              const newEth = isBTC ? Number(cur.eth) : Number(cur.eth) - Number(o.quantity);
              await pool.query('INSERT INTO balances(mode,thb,btc,eth) VALUES($1,$2,$3,$4)', ['PAPER', thb, newBtc, newEth]);
            }
          }
        }
      }
    } catch (err) {
      console.error('worker error', err);
    }
    await new Promise(r=>setTimeout(r, interval));
  }
}

(async ()=>{
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/worker/src/index.ts:93',message:'Worker starting, checking imports',data:{hasCoreQuery:typeof coreQuery==='function',hasFetchTicker:typeof fetchTicker==='function'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // run migrations then start
    const fs = await import('fs');
    const path = await import('path');
    const client = await pool.connect();
    try {
    const migrationsDir = path.join(process.cwd(),'migrations');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/worker/src/index.ts:95',message:'Checking migrations directory',data:{cwd:process.cwd(),migrationsDir,exists:fs.existsSync(migrationsDir)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f=>f.endsWith('.sql')).sort();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/worker/src/index.ts:97',message:'Migrations found',data:{fileCount:files.length,files},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      for (const f of files) {
        const sql = fs.readFileSync(path.join(migrationsDir,f),'utf8');
        await client.query(sql);
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/worker/src/index.ts:103',message:'Migrations directory not found',data:{migrationsDir},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
    } finally {
      client.release();
    }
    console.log('starting worker loop');
    loop();
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/worker/src/index.ts:120',message:'Worker startup failed',data:{error:String(err),stack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.error('Worker startup error:', err);
    process.exit(1);
  }
})();
