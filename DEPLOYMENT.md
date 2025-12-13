# Production Deployment Checklist

## Pre-Deployment

### Security
- [ ] Changed `AUTH_USERNAME` from default
- [ ] Changed `AUTH_PASSWORD` to strong password (20+ chars)
- [ ] Generated new `API_SECRET_KEY` (use random string)
- [ ] Never committed `.env` file to git
- [ ] Reviewed all exposed ports in docker-compose.yml
- [ ] Configured Cloudflare Tunnel (if using)
- [ ] Enabled Cloudflare Access (if using)
- [ ] SSL/TLS certificate configured

### Configuration
- [ ] Set correct `DATABASE_URL` for production
- [ ] Reviewed and adjusted strategy triggers for current market
- [ ] Set conservative risk limits initially
- [ ] Configured proper `WORKER_INTERVAL_MS` (2000ms recommended)
- [ ] Set `LOG_LEVEL` appropriately (info or warn for production)
- [ ] Verified `TRADING_MODE=PAPER` initially

### Testing
- [ ] Ran all unit tests: `npm test`
- [ ] Built all packages successfully
- [ ] Built web app successfully
- [ ] Tested locally in paper mode for 24+ hours
- [ ] Verified no errors in logs
- [ ] Confirmed orders are being created/filled correctly
- [ ] Tested kill switch functionality
- [ ] Tested pause/resume functionality

## Deployment

### Server Setup (Oracle Cloud)
- [ ] Ubuntu 22.04 LTS instance created
- [ ] Firewall allows only necessary ports (22 for SSH, block 3000/5432)
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled
- [ ] Automatic security updates enabled
- [ ] Docker installed and running
- [ ] Docker Compose installed
- [ ] Non-root user created for deployment

### Application Deployment
- [ ] Code cloned/uploaded to server
- [ ] `.env` file created with production values
- [ ] Web app built: `cd apps/web && npm run build`
- [ ] Docker containers built
- [ ] Database migrations run successfully
- [ ] All containers started: `docker-compose up -d`
- [ ] All containers healthy: `docker-compose ps`

### Database
- [ ] PostgreSQL container running
- [ ] Database initialized with schema
- [ ] Initial settings inserted
- [ ] Bot state initialized
- [ ] Backup strategy configured
- [ ] Database persistent volume verified

### Monitoring Setup
- [ ] Can access logs: `docker-compose logs -f`
- [ ] Dashboard accessible via tunnel/domain
- [ ] Login works with production credentials
- [ ] All pages load without errors
- [ ] Live market data showing
- [ ] Worker pulse visible (check last_pulse_at in bot_state)

## Post-Deployment (First 24 Hours)

### Immediate Checks (First Hour)
- [ ] Worker is running (check logs)
- [ ] No errors in API logs
- [ ] No errors in Worker logs
- [ ] Dashboard responsive
- [ ] Market data updating
- [ ] Bot state shows RUNNING
- [ ] Equity snapshots being created

### Regular Monitoring
- [ ] Check every 2 hours on day 1
- [ ] Review all bot_events for anomalies
- [ ] Verify balances are updating correctly
- [ ] Confirm no unexpected orders
- [ ] Monitor portfolio value trend
- [ ] Check for any database errors

### Performance Validation
- [ ] Worker cycle time < 5 seconds
- [ ] API response time < 500ms
- [ ] Database queries performant
- [ ] No memory leaks (check with `docker stats`)
- [ ] Disk space sufficient
- [ ] CPU usage reasonable

## Week 1 Milestones

### Daily Tasks
- [ ] Review logs for errors/warnings
- [ ] Check daily PnL
- [ ] Verify strategy is executing as expected
- [ ] Monitor open orders
- [ ] Review recent fills
- [ ] Backup database

### Performance Review
- [ ] Total trades executed: ___
- [ ] Win rate: ___%
- [ ] Average profit per trade: ___ THB
- [ ] Max drawdown: ___ THB
- [ ] System uptime: ___%
- [ ] Error count: ___

### Strategy Adjustment
- [ ] Are triggers appropriate for market conditions?
- [ ] Is order size suitable?
- [ ] Are risk limits working?
- [ ] Has kill switch been needed?
- [ ] Any pattern in losses?

## Before Enabling Live Mode

### Critical Checks
- [ ] Paper mode ran successfully for 7+ days
- [ ] Win rate > 50% in paper mode
- [ ] Maximum daily loss limit tested and holds
- [ ] Kill switch tested multiple times
- [ ] Strategy logic understood completely
- [ ] Risk limits are conservative
- [ ] Emergency response plan ready

### Bitkub API Setup
- [ ] Bitkub account verified (KYC completed)
- [ ] API key created with appropriate permissions
- [ ] API secret stored securely
- [ ] IP whitelist configured (if available)
- [ ] Withdrawal disabled for API key (if possible)
- [ ] API rate limits understood

### Financial Preparation
- [ ] Starting with < 5,000 THB for first week
- [ ] Comfortable losing entire amount
- [ ] Separate from essential funds
- [ ] Tax implications understood
- [ ] Transaction fees factored in

### Live Mode Activation
- [ ] Set `TRADING_MODE=LIVE` in .env
- [ ] Added `BITKUB_API_KEY` to .env
- [ ] Added `BITKUB_API_SECRET` to .env
- [ ] Reduced order sizes (start with 500-1000 THB)
- [ ] Tightened risk limits
- [ ] Set very low daily loss limit (-500 THB initially)
- [ ] Restarted all containers
- [ ] Verified live mode active in dashboard

### First Live Trade
- [ ] Watching logs in real-time
- [ ] Dashboard open and monitoring
- [ ] Ready to hit kill switch if needed
- [ ] First order placed successfully
- [ ] Order appears on Bitkub exchange
- [ ] Fill reported correctly
- [ ] Balances updated accurately
- [ ] No errors in logs

## Ongoing Maintenance

### Daily
- [ ] Check dashboard overview
- [ ] Review error logs
- [ ] Verify bot is running
- [ ] Monitor daily PnL

### Weekly
- [ ] Full log review
- [ ] Strategy performance analysis
- [ ] Database backup
- [ ] System resource check
- [ ] Adjust triggers if needed

### Monthly
- [ ] Performance report
- [ ] Strategy optimization review
- [ ] Update dependencies (carefully!)
- [ ] Security audit
- [ ] Backup rotation

## Emergency Procedures

### If Bot Misbehaves
1. Hit KILL SWITCH immediately (dashboard)
2. Pause worker: `docker-compose stop worker`
3. Review logs to identify issue
4. Check open orders on exchange
5. Manually close positions if needed
6. Fix issue
7. Test in paper mode again
8. Resume carefully

### If Server Goes Down
1. Restart containers: `docker-compose restart`
2. Check all services healthy
3. Verify worker reconnects
4. Check for missed fills
5. Review any open orders
6. Monitor closely for 1 hour

### If Database Corrupted
1. Stop all services
2. Restore from latest backup
3. Verify data integrity
4. Rebuild from migrations if needed
5. Re-run worker carefully

## Notes

Date deployed: _______________
Initial balance: _______________ THB
Strategy triggers: BTC buy/sell: _______ / _______
                  ETH buy/sell: _______ / _______

Contact for issues: _______________
Backup location: _______________

---

**Remember:** Start small, monitor closely, iterate carefully!
