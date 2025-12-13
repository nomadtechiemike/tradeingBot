<template>
  <div class="orders">
    <h1>Trades & Orders</h1>
    
    <div class="section">
      <h2>Open Orders</h2>
      <div v-if="openOrders.length === 0" class="empty-state">
        No open orders
      </div>
      <table v-else class="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Pair</th>
            <th>Side</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Filled</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in openOrders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>{{ order.pair }}</td>
            <td :class="['side', order.side.toLowerCase()]">{{ order.side }}</td>
            <td>{{ formatNumber(order.price) }}</td>
            <td>{{ formatNumber(order.quantity) }}</td>
            <td>{{ formatNumber(order.filledQuantity) }}</td>
            <td><span :class="['status-badge', order.status.toLowerCase()]">{{ order.status }}</span></td>
            <td>{{ formatDate(order.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Recent Fills</h2>
      <div v-if="fills.length === 0" class="empty-state">
        No fills yet
      </div>
      <table v-else class="fills-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Order ID</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Fee</th>
            <th>Quantity</th>
            <th>Fee</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fill in fills" :key="fill.id">
            <td>{{ fill.id }}</td>
            <td>{{ fill.orderId }}</td>
            <td>{{ formatNumber(fill.price) }}</td>
            <td>{{ formatNumber(fill.quantity) }}</td>
            <td>{{ formatNumber(fill.fee) }}</td>
            <td>{{ formatDate(fill.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const openOrders = ref<any[]>([]);
const fills = ref<any[]>([]);
let refreshInterval: any = null;

const getToken = () => localStorage.getItem('authToken');
const apiHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

const refreshData = async () => {
  try {
    const ordersRes = await fetch('/api/orders/open', { headers: apiHeaders() });
    openOrders.value = await ordersRes.json();

    const fillsRes = await fetch('/api/fills?limit=50', { headers: apiHeaders() });
    fills.value = await fillsRes.json();
  } catch (error) {
    console.error('Error refreshing orders:', error);
  }
};

const formatNumber = (value: any) => {
  const num = parseFloat(value);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
};

const formatDate = (date: any) => {
  return new Date(date).toLocaleString('th-TH');
};

onMounted(() => {
  refreshData();
  refreshInterval = setInterval(refreshData, 3000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.orders {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.orders h1 {
  margin: 0;
  color: #1f2937;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #374151;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

.orders-table,
.fills-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.orders-table th,
.fills-table th {
  text-align: left;
  padding: 0.75rem;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.orders-table td,
.fills-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.side {
  font-weight: 600;
}

.side.buy {
  color: #16a34a;
}

.side.sell {
  color: #dc2626;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.open {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.filled {
  background: #dcfce7;
  color: #166534;
}

.status-badge.partial {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}
</style>
