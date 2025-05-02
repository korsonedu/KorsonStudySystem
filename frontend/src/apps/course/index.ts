/**
 * 课程系统入口
 */
import { RouteRecordRaw } from 'vue-router';

// 导入视图（目前为空）
// 未来将导入实际的课程系统视图

// 定义路由
export const courseRoutes: RouteRecordRaw[] = [
  {
    path: '/course',
    name: 'course-home',
    component: () => import('./views/CourseHome.vue'),
    meta: {
      requiresAuth: true,
      title: '课程系统 | 首页'
    }
  }
];

// 导出模块
export default {
  name: 'course',
  routes: courseRoutes
};
