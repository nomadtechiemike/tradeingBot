import dotenv from 'dotenv';
import { Pool } from 'pg';
import fetch from 'node-fetch';
import { query as coreQuery } from '@trader-bot/core/dist/db.js';
import { fetchTicker } from '@trader-bot/bitkub/dist/index.js';

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
              // update balances (very simple)
              const b = await pool.query('SELECT * FROM balances ORDER BY id DESC LIMIT 1');
              const cur = b.rows[0];
              const thb = Number(cur.thb) - Number(o.price)*Number(o.quantity);
              const btc = Number(cur.btc) + Number(o.quantity);
              await pool.query('INSERT INTO balances(mode,thb,btc,eth) VALUES($1,$2,$3,$4)', ['PAPER', thb, btc, cur.eth]);
            }
          } else {
            if (ticker.bestBid >= Number(o.price)) {
              await pool.query('INSERT INTO fills(order_id,price,quantity,fee) VALUES($1,$2,$3,$4)', [o.id, o.price, o.quantity, Number(process.env.PAPER_FEE_RATE || 0.0025) * o.price * o.quantity]);
              await pool.query('UPDATE orders SET status=$1 WHERE id=$2', ['FILLED', o.id]);
              const b = await pool.query('SELECT * FROM balances ORDER BY id DESC LIMIT 1');
              const cur = b.rows[0];
              const thb = Number(cur.thb) + Number(o.price)*Number(o.quantity);
              const eth = cur.eth;
              const btc = cur.btc - (pair.startsWith('BTC')? Number(o.quantity):0);
              const newbtc = btc;
              await pool.query('INSERT INTO balances(mode,thb,btc,eth) VALUES($1,$2,$3,$4)', ['PAPER', thb, newbtc, eth]);
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
  // run migrations then start
  const fs = await import('fs');
  const path = await import('path');
  const client = await pool.connect();
  try {
    const migrationsDir = path.join(process.cwd(),'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f=>f.endsWith('.sql')).sort();
      for (const f of files) {
        const sql = fs.readFileSync(path.join(migrationsDir,f),'utf8');
        await client.query(sql);
      }
    }
  } finally {
    client.release();
  }
  console.log('starting worker loop');
  loop();
})();
