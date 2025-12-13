<template>
  <div class="logs">
    <h1>Bot Logs</h1>

    <div class="controls">
      <select v-model="levelFilter" @change="refreshLogs">
        <option value="">All Levels</option>
        <option value="DEBUG">Debug</option>
        <option value="INFO">Info</option>
        <option value="WARN">Warning</option>
        <option value="ERROR">Error</option>
      </select>
      <button @click="refreshLogs">Refresh</button>
      <button @click="autoRefresh = !autoRefresh">
        {{ autoRefresh ? 'Disable' : 'Enable' }} Auto-refresh
      </button>
    </div>

    <div class="logs-container">
      <div v-if="events.length === 0" class="empty-state">
        No log entries found
      </div>
      <div v-for="event in events" :key="event.id" :class="['log-entry', event.level.toLowerCase()]">
        <div class="log-header">
          <span :class="['log-level', event.level.toLowerCase()]">{{ event.level }}</span>
          <span class="log-time">{{ formatTime(event.timestamp) }}</span>
        </div>
        <div class="log-message">{{ event.message }}</div>
        <div v-if="event.meta" class="log-meta">
          <pre>{{ JSON.stringify(event.meta, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const events = ref<any[]>([]);
const levelFilter = ref('');
const autoRefresh = ref(true);
let refreshInterval: any = null;

const getToken = () => localStorage.getItem('authToken');
const apiHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

const refreshLogs = async () => {
  try {
    const params = new URLSearchParams();
    params.append('limit', '100');
    if (levelFilter.value) {
      params.append('level', levelFilter.value);
    }

    const response = await fetch(`/api/events?${params.toString()}`, { headers: apiHeaders() });
    events.value = await response.json();
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
};

const formatTime = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

onMounted(() => {
  refreshLogs();
  refreshInterval = setInterval(() => {
    if (autoRefresh.value) {
      refreshLogs();
    }
  }, 5000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.logs {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.logs h1 {
  margin: 0;
  color: #1f2937;
}

.controls {
  display: flex;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.controls select,
.controls button {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
}

.controls button:hover {
  background: #f3f4f6;
}

.logs-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: 70vh;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
  font-style: italic;
}

.log-entry {
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 4px;
}

.log-entry.debug {
  border-left-color: #9ca3af;
}

.log-entry.info {
  border-left-color: #3b82f6;
}

.log-entry.warn {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.log-entry.error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.log-level {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.log-level.debug {
  background: #f3f4f6;
  color: #6b7280;
}

.log-level.info {
  background: #dbeafe;
  color: #1e40af;
}

.log-level.warn {
  background: #fef3c7;
  color: #92400e;
}

.log-level.error {
  background: #fee2e2;
  color: #991b1b;
}

.log-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.log-message {
  font-size: 0.875rem;
  color: #1f2937;
  line-height: 1.5;
}

.log-meta {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  font-size: 0.75rem;
}

.log-meta pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #4b5563;
}
</style>
