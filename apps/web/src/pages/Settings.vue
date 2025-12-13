<template>
  <div class="settings">
    <h1>Settings</h1>

    <!-- Trading Mode -->
    <div class="card">
      <h2>Trading Mode</h2>
      <div class="mode-selector">
        <label class="mode-option">
          <input type="radio" v-model="tradingMode" value="PAPER" @change="confirmModeChange" />
          <div class="mode-card">
            <strong>PAPER</strong>
            <p>Simulated trading with virtual funds</p>
          </div>
        </label>
        <label class="mode-option">
          <input type="radio" v-model="tradingMode" value="LIVE" @change="confirmModeChange" />
          <div class="mode-card danger">
            <strong>LIVE</strong>
            <p>Real trading with Bitkub API</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Strategy Settings -->
    <div class="card">
      <h2>Strategy Settings</h2>
      
      <div class="pair-settings">
        <h3>BTC/THB</h3>
        <div class="form-grid">
          <label>
            <span>Enabled</span>
            <input type="checkbox" v-model="btcSettings.enabled" @change="saveStrategySettings" />
          </label>
          <label>
            <span>Buy Trigger (THB)</span>
            <input type="number" v-model.number="btcSettings.buyTrigger" @change="saveStrategySettings" />
          </label>
          <label>
            <span>Sell Trigger (THB)</span>
            <input type="number" v-model.number="btcSettings.sellTrigger" @change="saveStrategySettings" />
          </label>
          <label>
            <span>Order Size (THB)</span>
            <input type="number" v-model.number="btcSettings.orderSizeTHB" @change="saveStrategySettings" />
          </label>
        </div>
      </div>

      <div class="pair-settings">
        <h3>ETH/THB</h3>
        <div class="form-grid">
          <label>
            <span>Enabled</span>
            <input type="checkbox" v-model="ethSettings.enabled" @change="saveStrategySettings" />
          </label>
          <label>
            <span>Buy Trigger (THB)</span>
            <input type="number" v-model.number="ethSettings.buyTrigger" @change="saveStrategySettings" />
          </label>
          <label>
            <span>Sell Trigger (THB)</span>
            <input type="number" v-model.number="ethSettings.sellTrigger" @change="saveStrategySettings" />
          </label>
          <label>
            <span>Order Size (THB)</span>
            <input type="number" v-model.number="ethSettings.orderSizeTHB" @change="saveStrategySettings" />
          </label>
        </div>
      </div>
    </div>

    <!-- Risk Limits -->
    <div class="card">
      <h2>Risk Limits</h2>
      <div class="form-grid">
        <label>
          <span>Max THB Per Trade</span>
          <input type="number" v-model.number="riskLimits.maxTHBPerTrade" @change="saveRiskLimits" />
        </label>
        <label>
          <span>Max Exposure THB Per Pair</span>
          <input type="number" v-model.number="riskLimits.maxExposureTHBPerPair" @change="saveRiskLimits" />
        </label>
        <label>
          <span>Max Open Orders</span>
          <input type="number" v-model.number="riskLimits.maxOpenOrders" @change="saveRiskLimits" />
        </label>
        <label>
          <span>Max Daily Loss THB (negative)</span>
          <input type="number" v-model.number="riskLimits.maxDailyLossTHB" @change="saveRiskLimits" />
        </label>
      </div>
    </div>

    <div v-if="saveMessage" class="save-message">{{ saveMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const tradingMode = ref('PAPER');
const btcSettings = ref({
  enabled: true,
  buyTrigger: 1200000,
  sellTrigger: 1300000,
  orderSizeTHB: 5000
});
const ethSettings = ref({
  enabled: true,
  buyTrigger: 30000,
  sellTrigger: 35000,
  orderSizeTHB: 3000
});
const riskLimits = ref({
  maxTHBPerTrade: 10000,
  maxExposureTHBPerPair: 50000,
  maxOpenOrders: 5,
  maxDailyLossTHB: -20000
});
const saveMessage = ref('');

const getToken = () => localStorage.getItem('authToken');
const apiHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

const loadSettings = async () => {
  try {
    const modeRes = await fetch('/api/settings/mode', { headers: apiHeaders() });
    const modeData = await modeRes.json();
    tradingMode.value = modeData.mode;

    const strategyRes = await fetch('/api/settings/strategy', { headers: apiHeaders() });
    const strategy = await strategyRes.json();
    btcSettings.value = strategy.btc;
    ethSettings.value = strategy.eth;

    const riskRes = await fetch('/api/settings/risk', { headers: apiHeaders() });
    riskLimits.value = await riskRes.json();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

const confirmModeChange = async () => {
  if (tradingMode.value === 'LIVE') {
    const confirmed = confirm('⚠️ WARNING: You are about to enable LIVE trading. This will place REAL orders on the exchange. Are you sure?');
    if (!confirmed) {
      tradingMode.value = 'PAPER';
      return;
    }
  }

  try {
    await fetch('/api/settings/mode', {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ mode: tradingMode.value })
    });
    showSaveMessage('Trading mode updated');
  } catch (error) {
    console.error('Error updating mode:', error);
    showSaveMessage('Failed to update mode', true);
  }
};

const saveStrategySettings = async () => {
  try {
    await fetch('/api/settings/strategy/btc', {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify(btcSettings.value)
    });

    await fetch('/api/settings/strategy/eth', {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify(ethSettings.value)
    });

    showSaveMessage('Strategy settings saved');
  } catch (error) {
    console.error('Error saving strategy:', error);
    showSaveMessage('Failed to save strategy', true);
  }
};

const saveRiskLimits = async () => {
  try {
    await fetch('/api/settings/risk', {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify(riskLimits.value)
    });
    showSaveMessage('Risk limits saved');
  } catch (error) {
    console.error('Error saving risk limits:', error);
    showSaveMessage('Failed to save risk limits', true);
  }
};

const showSaveMessage = (message: string, isError = false) => {
  saveMessage.value = message;
  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);
};

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings h1 {
  margin: 0;
  color: #1f2937;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #374151;
}

.card h3 {
  margin: 1.5rem 0 1rem 0;
  font-size: 1rem;
  color: #667eea;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.card h3:first-child {
  margin-top: 0;
}

.mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.mode-option {
  cursor: pointer;
}

.mode-option input[type="radio"] {
  display: none;
}

.mode-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.mode-option input[type="radio"]:checked + .mode-card {
  border-color: #667eea;
  background: #f0f4ff;
}

.mode-card.danger {
  border-color: #fecaca;
}

.mode-option input[type="radio"]:checked + .mode-card.danger {
  border-color: #ef4444;
  background: #fef2f2;
}

.mode-card strong {
  display: block;
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.mode-card p {
  margin: 0;
  color: #666;
  font-size: 0.875rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.pair-settings {
  margin-bottom: 1.5rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label span {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

input[type="number"],
input[type="text"] {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.save-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #dcfce7;
  color: #166534;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
