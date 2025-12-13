# Trading Bot + Dashboard

A single-user crypto trading bot with web dashboard for 24/7 automated trading on Bitkub exchange.

## Features

- **Paper Trading Mode**: Simulated trading with virtual funds (20,000 THB initial balance)
- **Live Trading Mode**: Real trading with Bitkub API (disabled by default)
- **Automated Strategy**: Rule-based buy/sell triggers with configurable parameters
- **Risk Management**: Multiple safety limits including kill switch, daily loss limits, and exposure caps
- **Web Dashboard**: Real-time monitoring with Vue 3
- **Secure**: Session-based authentication with rate limiting

## Architecture

```
trader-bot/
├── apps/
│   ├── api/        # Fastify API server + serves web dashboard
│   ├── worker/     # Bot execution loop
│   └── web/        # Vue 3 dashboard
├── packages/
│   ├── core/       # Shared types, strategy, risk engine, DB schema
│   ├── bitkub/     # Bitkub API client
│   └── paper/      # Paper trading simulator
└── migrations/     # Database migrations
```

## Prerequisites

- **Node.js**: 18+ 
- **PostgreSQL**: 14+
- **npm**: 8+

For Docker deployment:
- **Docker**: 20+
- **Docker Compose**: 2+

## Quick Start (Local Development)

### 1. Clone and Install

```bash
cd c:\Users\techi\Documents\tradeingBot
npm install
```

### 2. Set up Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

Key environment variables:
```env
DATABASE_URL=postgresql://trader:trader123@localhost:5432/trader_bot
AUTH_USERNAME=admin
AUTH_PASSWORD=changeme
TRADING_MODE=PAPER
```

### 3. Start PostgreSQL

```bash
# Using Docker
docker run -d \
  --name trader-bot-postgres \
  -e POSTGRES_USER=trader \
  -e POSTGRES_PASSWORD=trader123 \
  -e POSTGRES_DB=trader_bot \
  -p 5432:5432 \
  postgres:16-alpine
```

Or install PostgreSQL locally and create database:
```sql
CREATE DATABASE trader_bot;
CREATE USER trader WITH PASSWORD 'trader123';
GRANT ALL PRIVILEGES ON DATABASE trader_bot TO trader;
```

### 4. Run Migrations

```bash
npm run db:migrate
```

### 5. Start Development Servers

```bash
# Terminal 1: Build packages
cd packages/core && npm run build
cd ../bitkub && npm run build
cd ../paper && npm run build

# Terminal 2: API Server
cd apps/api
npm run dev

# Terminal 3: Worker
cd apps/worker
npm run dev

# Terminal 4: Web Dashboard
cd apps/web
npm run dev
```

Access dashboard at: http://localhost:5173

## Docker Deployment (Production)

### 1. Build and Run

```bash
# Build web app first
cd apps/web
npm install
npm run build

# Start all services
cd ../..
docker-compose up -d
```

### 2. Run Migrations

```bash
docker-compose exec api npm run db:migrate
```

### 3. Access Dashboard

http://localhost:3000

Default credentials:
- Username: `admin`
- Password: `changeme`

**⚠️ Change these immediately in production!**

## Oracle Cloud Deployment

### 1. Prepare Server

```bash
# SSH into your Oracle Cloud instance
ssh ubuntu@<your-instance-ip>

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose git
sudo usermod -aG docker $USER
```

### 2. Clone and Deploy

```bash
git clone <your-repo> trader-bot
cd trader-bot

# Create .env file
cp .env.example .env
nano .env  # Edit with your settings

# Build web
cd apps/web
npm install
npm run build
cd ../..

# Start services
docker-compose up -d

# Run migrations
docker-compose exec api npm run db:migrate
```

### 3. Set up Cloudflare Tunnel

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create trader-bot

# Configure tunnel
nano ~/.cloudflared/config.yml
```

Add to config.yml:
```yaml
tunnel: <tunnel-id>
credentials-file: /home/ubuntu/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: trader.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Start tunnel:
```bash
cloudflared tunnel run trader-bot
```

Or as a service:
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 4. Configure Cloudflare Access

In Cloudflare dashboard:
1. Go to Zero Trust > Access > Applications
2. Add application for `trader.yourdomain.com`
3. Set policy to allow only your email
4. Enable "Cloudflare Access" authentication

## Configuration

### Strategy Settings

Edit via dashboard Settings page or directly in database:

```sql
-- BTC/THB strategy
INSERT INTO settings (key, value) VALUES 
('strategy_btc', '{"enabled":true,"buyTrigger":1200000,"sellTrigger":1300000,"orderSizeTHB":5000}');

-- ETH/THB strategy
INSERT INTO settings (key, value) VALUES 
('strategy_eth', '{"enabled":true,"buyTrigger":30000,"sellTrigger":35000,"orderSizeTHB":3000}');
```

### Risk Limits

```sql
INSERT INTO settings (key, value) VALUES 
('risk_limits', '{
  "maxTHBPerTrade":10000,
  "maxExposureTHBPerPair":50000,
  "maxOpenOrders":5,
  "maxDailyLossTHB":-20000
}');
```

### Enable Live Trading

1. Get Bitkub API keys from https://www.bitkub.com/api-management
2. Set in .env:
```env
TRADING_MODE=LIVE
BITKUB_API_KEY=your-api-key
BITKUB_API_SECRET=your-api-secret
```
3. Restart services
4. **Test with small amounts first!**

## Dashboard Pages

### Overview
- Bot status (Running/Stopped/Paused)
- Portfolio value in THB
- Today's PnL
- Kill switch control

### Markets
- Live BTC/THB and ETH/THB prices
- 24h change, high, low
- Best bid/ask

### Trades & Orders
- Open orders table
- Recent fills/trades history

### Settings
- Trading mode switch (Paper/Live)
- Per-pair strategy settings
- Risk limits configuration
- Auto-saves on change

### Logs
- Bot events and decisions
- Filterable by level (Debug, Info, Warn, Error)
- Auto-refresh

## Strategy Logic

**Buy Signal**: When `lastPrice <= buyTrigger`
- Places limit buy order at current price
- Checks risk limits before execution

**Sell Signal**: When `lastPrice >= sellTrigger` AND holding asset
- Places limit sell order at current price
- Only sells if we have the asset

**Fill Simulation** (Paper Mode):
- Buy fills when `bestAsk <= limitPrice`
- Sell fills when `bestBid >= limitPrice`
- Applies configurable fee (default 0.25%) and slippage

## Risk Controls

1. **Kill Switch**: Blocks all orders when enabled
2. **Max THB Per Trade**: Limits single order size
3. **Max Exposure Per Pair**: Total position value limit
4. **Max Open Orders**: Prevents too many concurrent orders
5. **Max Daily Loss**: Auto-pauses if daily loss exceeds limit
6. **Worker Lock**: Ensures only one worker instance runs

## Testing

```bash
# Run all tests
npm test

# Test specific package
cd packages/core
npm test
```

## Monitoring

### Check Logs

```bash
# API logs
docker-compose logs -f api

# Worker logs
docker-compose logs -f worker

# Database
docker-compose logs -f postgres
```

### Database Inspection

```bash
# Connect to DB
docker-compose exec postgres psql -U trader -d trader_bot

# View recent events
SELECT * FROM bot_events ORDER BY timestamp DESC LIMIT 10;

# View open orders
SELECT * FROM orders WHERE status = 'OPEN';

# View today's equity
SELECT * FROM equity_snapshots 
WHERE timestamp::date = CURRENT_DATE 
ORDER BY timestamp DESC;
```

## Troubleshooting

### Worker not running
1. Check `bot_state` table: `SELECT * FROM bot_state;`
2. Ensure `is_running = true` and `kill_switch = false`
3. Check worker logs for errors

### Orders not filling (Paper mode)
1. Check market prices vs. order prices
2. Verify triggers are set appropriately
3. Check logs for "why" messages

### Can't access dashboard
1. Verify API is running: `curl http://localhost:3000/health`
2. Check Cloudflare tunnel status
3. Verify authentication credentials

### Database connection errors
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in .env
3. Verify network connectivity

## Security Best Practices

1. **Change default credentials** immediately
2. **Use strong passwords** (20+ characters)
3. **Never commit .env** to version control
4. **Enable Cloudflare Access** for additional auth layer
5. **Start with paper mode** to test strategies
6. **Use small amounts** when testing live mode
7. **Monitor daily** for the first week
8. **Set conservative risk limits** initially

## Maintenance

### Backup Database

```bash
docker-compose exec postgres pg_dump -U trader trader_bot > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U trader trader_bot < backup.sql
```

### Update Code

```bash
git pull
cd apps/web && npm install && npm run build && cd ../..
docker-compose down
docker-compose up -d --build
```

## Performance

- **Worker cycle**: 2 seconds (configurable via `WORKER_INTERVAL_MS`)
- **Market data refresh**: Every worker cycle
- **Dashboard polls**: Every 3-5 seconds
- **Database**: Indexed for fast queries

## Limitations (v1)

- Only supports BTC/THB and ETH/THB pairs
- Simple trigger-based strategy (no ML or advanced indicators)
- One active position per pair
- Paper mode uses simulated fills (no orderbook depth simulation)
- Single-user only

## Roadmap

- [ ] WebSocket for real-time dashboard updates
- [ ] More sophisticated strategies (moving averages, RSI, etc.)
- [ ] Backtesting engine
- [ ] Performance analytics and charts
- [ ] Email/Telegram alerts
- [ ] Multi-pair support
- [ ] Position sizing based on volatility

## License

Private use only.

## Support

For issues or questions, check the logs first. Most problems are visible in bot_events table or container logs.

**Remember**: This is experimental software. Never risk more than you can afford to lose.
