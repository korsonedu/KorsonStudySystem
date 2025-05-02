/**
 * 排行榜系统入口
 */
import { RouteRecordRaw } from 'vue-router';

// 导入视图（目前为空）
// 未来将导入实际的排行榜系统视图

// 定义路由
export const leaderboardRoutes: RouteRecordRaw[] = [
  {
    path: '/leaderboard',
    name: 'leaderboard-home',
    component: () => import('./views/LeaderboardHome.vue'),
    meta: {
      requiresAuth: true,
      title: '排行榜 | 首页'
    }
  }
];

// 导出模块
export default {
  name: 'leaderboard',
  routes: leaderboardRoutes
};
