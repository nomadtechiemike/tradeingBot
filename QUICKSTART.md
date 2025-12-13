# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```powershell
cd c:\Users\techi\Documents\tradeingBot
npm install
```

### Step 2: Set Environment
```powershell
copy .env.example .env
# Edit .env - change AUTH_PASSWORD at minimum!
```

### Step 3: Start PostgreSQL
```powershell
docker run -d --name trader-bot-postgres -e POSTGRES_USER=trader -e POSTGRES_PASSWORD=trader123 -e POSTGRES_DB=trader_bot -p 5432:5432 postgres:16-alpine
```

### Step 4: Build Packages
```powershell
cd packages\core; npm run build; cd ..\..
cd packages\bitkub; npm run build; cd ..\..
cd packages\paper; npm run build; cd ..\..
```

### Step 5: Run Migrations
```powershell
npm run db:migrate
```

### Step 6: Start Services (3 terminals)

**Terminal 1 - API:**
```powershell
cd apps\api
npm run dev
```

**Terminal 2 - Worker:**
```powershell
cd apps\worker
npm run dev
```

**Terminal 3 - Web:**
```powershell
cd apps\web
npm run dev
```

### Step 7: Access Dashboard

Open http://localhost:5173

Default login:
- **Username:** admin
- **Password:** changeme (or what you set in .env)

---

## 📊 What You'll See

### Overview Page
- Bot status indicator
- Current portfolio value in THB
- Today's PnL
- **KILL SWITCH** button (emergency stop)

### Markets Page
- Live BTC/THB and ETH/THB prices
- Updates every 2 seconds
- 24h high/low/change

### Orders Page
- Open orders table
- Recent fills history
- Auto-refreshes

### Settings Page
- Strategy configuration per pair
- Risk limits
- Trading mode switch (PAPER/LIVE)
- Changes save immediately

### Logs Page
- Real-time bot decisions
- Error tracking
- Filter by level

---

## ⚙️ Initial Configuration

The bot starts in **PAPER MODE** with:
- 20,000 THB virtual balance
- BTC/THB strategy enabled (buy at 1,200,000, sell at 1,300,000)
- ETH/THB strategy enabled (buy at 30,000, sell at 35,000)
- Conservative risk limits

### Adjust Strategy

Go to **Settings** page and modify:
- **Buy Trigger**: Price below which bot will buy
- **Sell Trigger**: Price above which bot will sell
- **Order Size**: Amount in THB per order

Example for BTC:
```
Buy Trigger: 1,200,000 THB
Sell Trigger: 1,300,000 THB
Order Size: 5,000 THB
```

---

## 🛡️ Safety Features

1. **Kill Switch** - Stops ALL trading immediately
2. **Pause/Resume** - Temporarily halt without stopping worker
3. **Daily Loss Limit** - Auto-pauses if losses exceed threshold
4. **Max Orders** - Prevents creating too many positions
5. **Balance Checks** - Won't order if insufficient funds

---

## 🧪 Testing Your Strategy

1. Set realistic triggers based on current market prices
2. Watch the **Logs** page for bot decisions
3. Monitor **Overview** for PnL changes
4. Check **Orders** page for executions
5. Adjust settings based on results

Paper mode is **100% safe** - no real money involved!

---

## ⚠️ Before Going LIVE

**DO NOT enable live mode until:**

1. ✅ You've tested paper mode for at least 1 week
2. ✅ You understand how the strategy works
3. ✅ You have Bitkub API keys ready
4. ✅ You've set conservative risk limits
5. ✅ You're comfortable with potential losses
6. ✅ You start with SMALL amounts (< 1,000 THB)

**To enable live mode:**
```env
# In .env file:
TRADING_MODE=LIVE
BITKUB_API_KEY=your-key-here
BITKUB_API_SECRET=your-secret-here
```

Then restart all services.

---

## 🔍 Monitoring

### Check Worker is Running
```powershell
# Should see "Worker cycle" messages
docker-compose logs -f worker
```

### Check Recent Trades
```sql
docker-compose exec postgres psql -U trader -d trader_bot -c "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"
```

### Check Bot Events
```sql
docker-compose exec postgres psql -U trader -d trader_bot -c "SELECT timestamp, level, message FROM bot_events ORDER BY timestamp DESC LIMIT 10;"
```

---

## 🐛 Troubleshooting

### Bot Not Trading
1. Check kill switch is OFF (Overview page)
2. Verify bot is RUNNING not PAUSED
3. Check current prices vs. your triggers (may not match)
4. Look at Logs page for "blocked" reasons

### Can't Login
1. Check AUTH_USERNAME and AUTH_PASSWORD in .env
2. Clear browser cache/cookies
3. Restart API server

### Database Errors
1. Ensure PostgreSQL is running: `docker ps`
2. Check DATABASE_URL in .env
3. Re-run migrations: `npm run db:migrate`

---

## 📱 Next Steps

1. **Monitor Daily** - Check Overview page for PnL
2. **Read Logs** - Understand why bot makes decisions
3. **Adjust Strategy** - Fine-tune triggers based on market
4. **Set Alerts** - Consider adding email notifications (future)
5. **Backup Data** - Export database regularly

---

## 📚 Learn More

- Full documentation: `README.md`
- Strategy logic: `packages/core/src/strategy.ts`
- Risk engine: `packages/core/src/risk.ts`
- Paper trading: `packages/paper/src/wallet.ts`

---

## 💡 Strategy Tips

**Conservative (Lower Risk):**
- Small order sizes (1,000-2,000 THB)
- Wide trigger spreads (10%+ difference)
- Low daily loss limit (-1,000 THB)

**Aggressive (Higher Risk):**
- Larger order sizes (5,000-10,000 THB)
- Tight trigger spreads (3-5% difference)
- Higher daily loss limit (-5,000 THB)

**Remember:** Past performance doesn't guarantee future results!

---

## 🎯 Success Checklist

- [ ] Dashboard loads without errors
- [ ] Can see live market prices
- [ ] Bot status shows "RUNNING"
- [ ] Logs show regular updates
- [ ] Can modify settings and they save
- [ ] Kill switch works (stops trading)
- [ ] Paper trades are being simulated

If all checked, you're ready to test! 🎉

---

**Need Help?** Check the logs first - they tell you everything!
