/**
 * 计划服务
 * 直接使用后端API存储计划数据
 */

import apiService from './apiService';
import { API_CONFIG } from '../config';

// 计划类型定义
export interface Plan {
  id?: number | string;
  text: string; // 后端使用text字段而不是title
  completed?: boolean;
  started?: boolean;
  createdAt?: string; // 创建时间，用于排序和过滤
  // 保留这些字段以兼容前端代码
  title?: string;
  description?: string;
}

/**
 * 计划服务类
 */
export class PlanService {
  /**
   * 获取所有计划
   */
  async getAllPlans(): Promise<Plan[]> {
    try {
      console.log('Calling getPlans API...');
      const response = await apiService.get(API_CONFIG.ENDPOINTS.PLANS.BASE);
      if (response && response.data) {
        const plans = Array.isArray(response.data) ? response.data : [response.data];
        console.log('Successfully fetched plans from API:', plans.length);
        return plans;
      }
      return [];
    } catch (error) {
      console.error('Error getting all plans:', error);
      throw error;
    }
  }

  /**
   * 添加新计划
   */
  async addPlan(plan: Plan): Promise<Plan> {
    try {
      // 确保使用正确的字段名
      const planData = {
        text: plan.text || plan.title || '',
        completed: plan.completed || false,
        started: plan.started || false,
        createdAt: plan.createdAt || new Date().toISOString() // 确保有创建时间字段
      };

      console.log('Creating plan with API:', planData);
      const response = await apiService.post(API_CONFIG.ENDPOINTS.PLANS.BASE, planData);
      if (response && response.data) {
        console.log('Plan saved to API successfully:', response.data);
        return response.data;
      }
      throw new Error('Failed to create plan: No data returned from API');
    } catch (error) {
      console.error('Error adding plan:', error);
      throw error;
    }
  }

  /**
   * 更新计划
   */
  async updatePlan(planId: number | string, planData: Partial<Plan>): Promise<Plan> {
    try {
      // 确保使用正确的字段名
      const apiPlanData = {
        text: planData.text || planData.title || undefined,
        completed: planData.completed,
        started: planData.started
      };

      // 移除未定义的字段
      Object.keys(apiPlanData).forEach(key => {
        if (apiPlanData[key as keyof typeof apiPlanData] === undefined) {
          delete apiPlanData[key as keyof typeof apiPlanData];
        }
      });

      const response = await apiService.put(API_CONFIG.ENDPOINTS.PLANS.DETAIL(planId), apiPlanData);
      if (response && response.data) {
        console.log('Plan updated in API successfully:', response.data);
        return response.data;
      }
      throw new Error('Failed to update plan: No data returned from API');
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  /**
   * 删除计划
   */
  async deletePlan(planId: number | string): Promise<void> {
    try {
      await apiService.delete(API_CONFIG.ENDPOINTS.PLANS.DETAIL(planId));
      console.log('Plan deleted from API successfully');
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }
}

// 创建默认实例
export const planService = new PlanService();

export default planService;
