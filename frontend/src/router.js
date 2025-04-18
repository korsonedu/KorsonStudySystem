import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import StatisticsView from './views/StatisticsView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: 'statistics',
    name: 'Statistics',
    component: StatisticsView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;