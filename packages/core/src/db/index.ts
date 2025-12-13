import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export async function initializeDatabase(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}

export function getDatabase() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return dbInstance;
}

export type Database = ReturnType<typeof drizzle>;

/**
 * Advisory lock for worker process - ensures only one worker runs at a time
 */
export async function acquireWorkerLock(db: Database, lockId: number = 1): Promise<boolean> {
  try {
    const result = await db.execute(sql`SELECT pg_try_advisory_lock(${lockId}) as locked`);
    return (result.rows[0]?.locked as boolean) ?? false;
  } catch (error) {
    console.error('Failed to acquire advisory lock:', error);
    return false;
  }
}

export async function releaseWorkerLock(db: Database, lockId: number = 1): Promise<void> {
  try {
    await db.execute(sql`SELECT pg_advisory_unlock(${lockId})`);
  } catch (error) {
    console.error('Failed to release advisory lock:', error);
  }
}

export { schema };
