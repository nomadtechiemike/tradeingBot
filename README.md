# Trader Bot - Monorepo

This is a minimal single-user crypto trading bot monorepo.

Features:
- Fastify API
- Worker performing PAPER trading
- Vue 3 + Vite dashboard
- Postgres DB with SQL migrations
- Docker + docker-compose for deployment

Quick start (development)
1. Copy `.env.example` to `.env` and edit values.
2. Build images and run with Docker Compose:

```bash
docker compose build
docker compose up
```

API: http://localhost:3000
Web: http://localhost:5173

Notes:
- Paper trading mode is default. Live mode requires Bitkub keys and implementing private client.
- The migrations are in `/migrations` and are applied automatically at startup.

