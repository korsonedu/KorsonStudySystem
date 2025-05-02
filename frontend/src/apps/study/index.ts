/**
 * 学习追踪系统入口
 */
import { RouteRecordRaw } from 'vue-router';

// 导入视图
import Home from './views/Home.vue';
import Statistics from './views/Statistics.vue';
import Achievements from './views/Achievements.vue';

// 定义路由
export const studyRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      requiresAuth: true,
      title: '学习追踪 | 首页'
    }
  },
  {
    path: '/statistics',
    name: 'statistics',
    component: Statistics,
    meta: {
      requiresAuth: true,
      title: '学习追踪 | 统计'
    }
  },
  {
    path: '/achievements',
    name: 'achievements',
    component: Achievements,
    meta: {
      requiresAuth: true,
      title: '学习追踪 | 成就'
    }
  }
];

// 导出模块
export default {
  name: 'study',
  routes: studyRoutes
};
