/**
 * 计划服务
 * 处理计划的创建、获取、更新、删除等操作
 */
import { apiService } from '../../../shared/services/apiService';
import { API_CONFIG } from '../../../config';

// 计划类型定义
export interface Plan {
  id?: number;
  text: string;
  completed?: boolean;
  started?: boolean;
  created_at?: string;
  start_time?: string;
  end_time?: string;
  user_id?: number;
}

/**
 * 计划服务类
 */
export class PlanService {
  /**
   * 获取所有计划
   */
  async getPlans(): Promise<Plan[]> {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.PLANS.BASE);
      return response.data || [];
    } catch (error) {
      console.error('获取计划失败:', error);
      return [];
    }
  }

  /**
   * 创建计划
   * @param plan 计划数据
   */
  async createPlan(plan: Plan): Promise<Plan | null> {
    try {
      const response = await apiService.post(API_CONFIG.ENDPOINTS.PLANS.BASE, plan);
      return response.data;
    } catch (error) {
      console.error('创建计划失败:', error);
      return null;
    }
  }

  /**
   * 更新计划
   * @param planId 计划ID
   * @param plan 计划数据
   */
  async updatePlan(planId: number, plan: Partial<Plan>): Promise<Plan | null> {
    try {
      const response = await apiService.put(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${planId}`, plan);
      return response.data;
    } catch (error) {
      console.error('更新计划失败:', error);
      return null;
    }
  }

  /**
   * 删除计划
   * @param planId 计划ID
   */
  async deletePlan(planId: number): Promise<boolean> {
    try {
      await apiService.delete(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${planId}`);
      return true;
    } catch (error) {
      console.error('删除计划失败:', error);
      return false;
    }
  }

  /**
   * 开始计划
   * @param planId 计划ID
   */
  async startPlan(planId: number): Promise<Plan | null> {
    try {
      const response = await apiService.post(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${planId}/start`);
      return response.data;
    } catch (error) {
      console.error('开始计划失败:', error);
      return null;
    }
  }

  /**
   * 完成计划
   * @param planId 计划ID
   */
  async completePlan(planId: number): Promise<Plan | null> {
    try {
      const response = await apiService.post(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${planId}/complete`);
      return response.data;
    } catch (error) {
      console.error('完成计划失败:', error);
      return null;
    }
  }

  /**
   * 获取单个计划
   * @param planId 计划ID
   */
  async getPlan(planId: number): Promise<Plan | null> {
    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${planId}`);
      return response.data;
    } catch (error) {
      console.error('获取计划详情失败:', error);
      return null;
    }
  }
}

// 导出计划服务实例
export const planService = new PlanService();
