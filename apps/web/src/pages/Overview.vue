<template>
  <div class="overview">
    <div class="status-grid">
      <div class="card">
        <h2>Bot Status</h2>
        <div :class="['status-badge', botState.isRunning ? 'running' : 'stopped']">
          {{ botState.isRunning ? 'RUNNING' : 'STOPPED' }}
        </div>
        <div v-if="botState.isPaused" class="status-badge paused">PAUSED</div>
        <div class="controls">
          <button @click="toggleBot" :disabled="loading">
            {{ botState.isRunning ? 'Stop' : 'Start' }}
          </button>
          <button @click="togglePause" :disabled="loading">
            {{ botState.isPaused ? 'Resume' : 'Pause' }}
          </button>
        </div>
      </div>

      <div class="card">
        <h2>Portfolio Value</h2>
        <div class="value">{{ formatTHB(portfolioValue) }} THB</div>
        <div class="subtext">{{ balances.btc.toFixed(8) }} BTC | {{ balances.eth.toFixed(8) }} ETH | {{ balances.thb.toFixed(2) }} THB</div>
      </div>

      <div class="card">
        <h2>Today's PnL</h2>
        <div :class="['pnl-value', dailyPnL >= 0 ? 'positive' : 'negative']">
          {{ formatTHB(dailyPnL) }} THB
        </div>
        <div class="subtext">{{ dailyPnLPercent >= 0 ? '+' : '' }}{{ dailyPnLPercent.toFixed(2) }}%</div>
      </div>

      <div class="card danger">
        <h2>Kill Switch</h2>
        <div :class="['status-badge', botState.killSwitch ? 'danger' : 'safe']">
          {{ botState.killSwitch ? 'ENABLED' : 'DISABLED' }}
        </div>
        <button @click="toggleKillSwitch" :disabled="loading" :class="['kill-btn', botState.killSwitch ? 'enabled' : '']">
          {{ botState.killSwitch ? 'Disable' : 'Enable' }}
        </button>
      </div>
    </div>

    <div class="card full-width">
      <h2>Mode: {{ tradingMode }}</h2>
      <p v-if="tradingMode === 'PAPER'" class="info-text">
        ✓ Running in paper (simulated) mode with initial balance of 20,000 THB
      </p>
      <p v-else class="warning-text">
        ⚠️ Running in LIVE mode with real exchange orders
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const loading = ref(false);
const botState = ref({
  isRunning: false,
  isPaused: false,
  killSwitch: false
});
const balances = ref({ thb: 0, btc: 0, eth: 0 });
const portfolioValue = ref(0);
const dailyPnL = ref(0);
const dailyPnLPercent = ref(0);
const tradingMode = ref('PAPER');

const getToken = () => localStorage.getItem('authToken');
const apiHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

const refreshData = async () => {
  try {
    const statusRes = await fetch('/api/bot/status', { headers: apiHeaders() });
    botState.value = await statusRes.json();

    const balanceRes = await fetch(`/api/balances?mode=${tradingMode.value}`, { headers: apiHeaders() });
    balances.value = await balanceRes.json();

    const equityRes = await fetch(`/api/equity/latest?mode=${tradingMode.value}`, { headers: apiHeaders() });
    const equity = await equityRes.json();
    portfolioValue.value = equity.totalValueTHB ? parseFloat(equity.totalValueTHB) : 20000;

    const pnlRes = await fetch(`/api/equity/daily-pnl?mode=${tradingMode.value}`, { headers: apiHeaders() });
    const pnl = await pnlRes.json();
    dailyPnL.value = pnl.dailyPnL;
    dailyPnLPercent.value = (dailyPnL.value / 20000) * 100;

    const modeRes = await fetch('/api/settings/mode', { headers: apiHeaders() });
    const modeData = await modeRes.json();
    tradingMode.value = modeData.mode;
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
};

const toggleBot = async () => {
  loading.value = true;
  try {
    const endpoint = botState.value.isRunning ? '/api/bot/stop' : '/api/bot/start';
    await fetch(endpoint, { method: 'POST', headers: apiHeaders() });
    await refreshData();
  } finally {
    loading.value = false;
  }
};

const togglePause = async () => {
  loading.value = true;
  try {
    const endpoint = botState.value.isPaused ? '/api/bot/resume' : '/api/bot/pause';
    await fetch(endpoint, { method: 'POST', headers: apiHeaders() });
    await refreshData();
  } finally {
    loading.value = false;
  }
};

const toggleKillSwitch = async () => {
  loading.value = true;
  try {
    const newState = !botState.value.killSwitch;
    await fetch(`/api/bot/kill-switch/${newState}`, { method: 'POST', headers: apiHeaders() });
    await refreshData();
  } finally {
    loading.value = false;
  }
};

const formatTHB = (value: number) => {
  return value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

onMounted(() => {
  refreshData();
  setInterval(refreshData, 5000);
});
</script>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card.full-width {
  grid-column: 1 / -1;
}

.card.danger {
  border-left: 4px solid #ef4444;
}

.card h2 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  color: #666;
  font-weight: 600;
}

.status-badge {
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.status-badge.running {
  background: #dcfce7;
  color: #166534;
}

.status-badge.stopped {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.paused {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.safe {
  background: #dcfce7;
  color: #166534;
}

.status-badge.danger {
  background: #fee2e2;
  color: #991b1b;
}

.value {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0.5rem 0;
  color: #1f2937;
}

.pnl-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

.pnl-value.positive {
  color: #16a34a;
}

.pnl-value.negative {
  color: #dc2626;
}

.subtext {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.5rem;
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.controls button,
.kill-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.controls button:hover:not(:disabled),
.kill-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.kill-btn.enabled {
  background: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
}

.kill-btn.enabled:hover:not(:disabled) {
  background: #fecaca;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-text {
  color: #0891b2;
  margin: 0.5rem 0 0 0;
}

.warning-text {
  color: #ea580c;
  margin: 0.5rem 0 0 0;
}
</style>
