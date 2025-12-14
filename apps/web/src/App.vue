<template>
  <div id="app" class="app dark">
    <header>
      <h1>Trader Bot Dashboard</h1>
    </header>
    <main>
      <section class="card">
        <h2>Overview</h2>
        <div class="row">
          <div>THB: {{ balances?.thb }}</div>
          <div>BTC: {{ balances?.btc }}</div>
          <div>ETH: {{ balances?.eth }}</div>
        </div>
        <div class="row">
          <button @click="kill">KILL SWITCH</button>
        </div>
      </section>
      <section class="card">
        <h2>Markets</h2>
        <div v-for="p in markets" :key="p.pair" class="market">
          <div>{{ p.pair }}</div>
          <div>Last: {{ p.last }}</div>
          <div>Bid: {{ p.bestBid }}</div>
          <div>Ask: {{ p.bestAsk }}</div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
  setup() {
    const balances = ref<any>(null);
    const markets = ref<any[]>([]);
    async function fetchStatus() {
      const r = await axios.get('/api/status');
      balances.value = r.data.balances;
    }
    async function fetchMarkets() {
      // fetch ticker via API in future; simple polling
      markets.value = [
        { pair: 'BTC/THB', last: 'n/a', bestBid: 'n/a', bestAsk: 'n/a' },
        { pair: 'ETH/THB', last: 'n/a', bestBid: 'n/a', bestAsk: 'n/a' }
      ];
    }
    async function kill() {
      await axios.post('/api/kill');
      alert('Kill switch activated');
    }
    onMounted(()=>{
      fetchStatus();
      fetchMarkets();
      setInterval(fetchStatus, 3000);
    });
    return { balances, markets, kill };
  }
}
</script>

<style>
body{margin:0;font-family:Inter,system-ui,Segoe UI,Roboto}
.app{padding:16px;background:#0f1720;color:#e6eef6;min-height:100vh}
.card{background:#0b1220;padding:12px;margin-bottom:12px;border-radius:8px}
.row{display:flex;gap:12px}
.market{display:flex;gap:8px}
button{background:#d33;color:white;padding:8px;border-radius:6px;border:0}
</style>
