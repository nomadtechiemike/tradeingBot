import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './packages/core/src/db/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://trader:trader123@localhost:5432/trader_bot'
  },
  verbose: true,
  strict: true
});
