import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString });

export async function query(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res;
}

export async function getClient() {
  return pool.connect();
}

export default pool;
