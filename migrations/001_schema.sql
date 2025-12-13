CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb
);

CREATE TABLE IF NOT EXISTS balances (
  id SERIAL PRIMARY KEY,
  mode text,
  thb numeric,
  btc numeric,
  eth numeric,
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  mode text,
  pair text,
  side text,
  price numeric,
  quantity numeric,
  status text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS fills (
  id SERIAL PRIMARY KEY,
  order_id integer REFERENCES orders(id),
  price numeric,
  quantity numeric,
  fee numeric,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS equity_snapshots (
  id SERIAL PRIMARY KEY,
  ts timestamptz default now(),
  total_value_thb numeric,
  mode text
);

CREATE TABLE IF NOT EXISTS bot_events (
  id SERIAL PRIMARY KEY,
  ts timestamptz default now(),
  level text,
  message text,
  meta jsonb
);

-- seed basic settings
INSERT INTO settings(key,value) VALUES ('strategy', '{"BTC/THB": {"enabled": true, "buyTrigger": 1200000, "sellTrigger": 1300000, "orderSizeTHB": 5000}, "ETH/THB": {"enabled": true, "buyTrigger": 30000, "sellTrigger": 35000, "orderSizeTHB": 3000}}') ON CONFLICT (key) DO NOTHING;

INSERT INTO settings(key,value) VALUES ('risk', '{"maxTHBPerTrade":10000,"maxExposureTHBPerPair":50000,"maxOpenOrders":5,"maxDailyLossTHB":-20000}') ON CONFLICT (key) DO NOTHING;

INSERT INTO balances(mode,thb,btc,eth) VALUES ('PAPER', 20000, 0, 0) ON CONFLICT DO NOTHING;
