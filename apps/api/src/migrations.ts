import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, name text UNIQUE, applied_at timestamptz DEFAULT now())`);
    const files = fs.readdirSync(path.join(process.cwd(),'migrations')).filter(f=>f.endsWith('.sql')).sort();
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
