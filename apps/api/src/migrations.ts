import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function migrate() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/api/src/migrations.ts:8',message:'API migrate called',data:{cwd:process.cwd()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, name text UNIQUE, applied_at timestamptz DEFAULT now())`);
    const migrationsDir = path.join(process.cwd(),'migrations');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/api/src/migrations.ts:13',message:'Checking migrations directory',data:{migrationsDir,exists:fs.existsSync(migrationsDir)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`Migrations directory not found: ${migrationsDir}`);
      return;
    }
    const files = fs.readdirSync(migrationsDir).filter(f=>f.endsWith('.sql')).sort();
    for (const f of files) {
      const exists = await client.query('SELECT 1 FROM migrations WHERE name=$1', [f]);
      if (exists.rowCount>0) continue;
      const sql = fs.readFileSync(path.join(process.cwd(),'migrations',f),'utf8');
      console.log('applying',f);
      await client.query(sql);
      await client.query('INSERT INTO migrations(name) VALUES($1)', [f]);
    }
  } finally {
    client.release();
  }
}
