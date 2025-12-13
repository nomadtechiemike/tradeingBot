<template>
  <div class="markets">
    <h1>Market Data</h1>
    <div class="market-grid">
      <div v-for="pair in pairs" :key="pair" class="market-card">
        <h2>{{ pair }}</h2>
        <div class="price-section">
          <div class="price">{{ formatPrice(prices[pair]) }} THB</div>
          <div :class="['change', changes[pair] >= 0 ? 'up' : 'down']">
            {{ changes[pair] >= 0 ? '+' : '' }}{{ changes[pair].toFixed(2) }}%
          </div>
        </div>
        <div class="details">
          <div class="detail-row">
            <span>24h High:</span>
            <span>{{ formatPrice(highs[pair]) }}</span>
          </div>
          <div class="detail-row">
            <span>24h Low:</span>
            <span>{{ formatPrice(lows[pair]) }}</span>
          </div>
          <div class="detail-row">
            <span>Best Bid:</span>
            <span>{{ formatPrice(bids[pair]) }}</span>
          </div>
          <div class="detail-row">
            <span>Best Ask:</span>
            <span>{{ formatPrice(asks[pair]) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const pairs = ['BTC/THB', 'ETH/THB'];
const prices = ref<Record<string, number>>({
  'BTC/THB': 0,
  'ETH/THB': 0
});
const bids = ref<Record<string, number>>({
  'BTC/THB': 0,
  'ETH/THB': 0
});
const asks = ref<Record<string, number>>({
  'BTC/THB': 0,
  'ETH/THB': 0
});
const highs = ref<Record<string, number>>({
  'BTC/THB': 0,
  'ETH/THB': 0
});
const lows = ref<Record<string, number>>({
  'BTC/THB': 0,
  'ETH/THB': 0
});
const changes = ref<Record<string, number>>({
  'BTC/THB': 0,
  'ETH/THB': 0
});

const getToken = () => localStorage.getItem('authToken');
const apiHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

const fetchMarkets = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/markets');
    const data = await res.json();
    
    if (data['BTC/THB']) {
      const btc = data['BTC/THB'];
      prices.value['BTC/THB'] = btc.last;
      bids.value['BTC/THB'] = btc.highestBid;
      asks.value['BTC/THB'] = btc.lowestAsk;
      highs.value['BTC/THB'] = btc.high24hr;
      lows.value['BTC/THB'] = btc.low24hr;
      changes.value['BTC/THB'] = btc.percentChange;
    }

    if (data['ETH/THB']) {
      const eth = data['ETH/THB'];
      prices.value['ETH/THB'] = eth.last;
      bids.value['ETH/THB'] = eth.highestBid;
      asks.value['ETH/THB'] = eth.lowestAsk;
      highs.value['ETH/THB'] = eth.high24hr;
      lows.value['ETH/THB'] = eth.low24hr;
      changes.value['ETH/THB'] = eth.percentChange;
    }
  } catch (error) {
    console.error('Error fetching markets:', error);
  }
};

const formatPrice = (value: number) => {
  return value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

onMounted(() => {
  fetchMarkets();
  setInterval(fetchMarkets, 2000);
});
</script>

<style scoped>
.markets {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.markets h1 {
  margin: 0;
  color: #1f2937;
}

.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.market-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.market-card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #667eea;
}

.price-section {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.5rem;
}

.price {
  font-size: 1.875rem;
  font-weight: bold;
  color: #1f2937;
}

.change {
  font-size: 1rem;
  font-weight: 600;
}

.change.up {
  color: #16a34a;
}

.change.down {
  color: #dc2626;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.875rem;
}

.detail-row span:first-child {
  color: #666;
  font-weight: 500;
}

.detail-row span:last-child {
  color: #1f2937;
  font-weight: 600;
}
</style>
