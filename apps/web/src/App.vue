<template>
  <div id="app" class="app-container">
    <header class="header">
      <h1>Trading Bot</h1>
      <nav>
        <router-link to="/">Overview</router-link>
        <router-link to="/markets">Markets</router-link>
        <router-link to="/orders">Trades & Orders</router-link>
        <router-link to="/settings">Settings</router-link>
        <router-link to="/logs">Logs</router-link>
        <button @click="logout" class="logout-btn">Logout</button>
      </nav>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(() => {
      localStorage.removeItem('authToken');
      router.push('/login');
    });
  }
};
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}

nav a:hover {
  background: rgba(255, 255, 255, 0.1);
}

nav a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid white;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: #f5f7fa;
}
</style>
