import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Overview from './pages/Overview.vue';
import Markets from './pages/Markets.vue';
import Orders from './pages/Orders.vue';
import Settings from './pages/Settings.vue';
import Logs from './pages/Logs.vue';

const routes = [
  { path: '/', component: Overview },
  { path: '/markets', component: Markets },
  { path: '/orders', component: Orders },
  { path: '/settings', component: Settings },
  { path: '/logs', component: Logs }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

const app = createApp(App);
app.use(router);
app.mount('#app');
