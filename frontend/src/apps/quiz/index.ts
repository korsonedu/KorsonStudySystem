/**
 * 题库系统入口
 */
import { RouteRecordRaw } from 'vue-router';

// 导入视图（目前为空）
// 未来将导入实际的题库系统视图

// 定义路由
export const quizRoutes: RouteRecordRaw[] = [
  {
    path: '/quiz',
    name: 'quiz-home',
    component: () => import('./views/QuizHome.vue'),
    meta: {
      requiresAuth: true,
      title: '题库系统 | 首页'
    }
  }
];

// 导出模块
export default {
  name: 'quiz',
  routes: quizRoutes
};
