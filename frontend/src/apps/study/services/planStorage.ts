/**
 * 计划存储服务
 * 实现计划的混合存储策略（本地存储 + 后端API）
 */

import { storage } from '../utils/storage';
import { plansAPI } from './api';

// 计划类型定义
export interface Plan {
  id?: number | string;
  text: string; // 后端使用text字段而不是title
  completed?: boolean;
  started?: boolean;
  // 保留这些字段以兼容前端代码
  title?: string;
  description?: string;
}

// 本地存储键
const PLANS_STORAGE_KEY = 'plans';
const SYNC_STATUS_KEY = 'plans_sync_status';

/**
 * 计划存储服务
 */
export class PlanStorageService {
  /**
   * 获取所有计划（合并本地和远程）
   */
  async getAllPlans(): Promise<Plan[]> {
    try {
      // 尝试从API获取计划
      let apiPlans: Plan[] = [];
      let apiSuccess = false;

      try {
        const response = await plansAPI.getPlans();
        if (response && response.data) {
          apiPlans = Array.isArray(response.data) ? response.data : [response.data];
          apiSuccess = true;
          console.log('Successfully fetched plans from API:', apiPlans.length);
        }
      } catch (error) {
        console.error('Failed to fetch plans from API:', error);
      }

      // 获取本地计划
      const localPlans: Plan[] = storage.getItem<Plan[]>(PLANS_STORAGE_KEY, []);
      console.log('Local plans:', localPlans.length);

      // 如果API成功，尝试同步本地未同步的计划
      if (apiSuccess) {
        await this.syncLocalPlansToAPI(localPlans, apiPlans);
      }

      // 合并计划（避免重复）
      const mergedPlans = [...apiPlans];

      // 添加本地计划（只添加那些在API中不存在的）
      for (const localPlan of localPlans) {
        // 检查是否已存在于API计划中
        const exists = apiPlans.some((apiPlan: Plan) =>
          this.arePlansEqual(apiPlan, localPlan)
        );

        if (!exists) {
          mergedPlans.push(localPlan);
        }
      }

      return mergedPlans;
    } catch (error) {
      console.error('Error getting all plans:', error);

      // 如果出错，返回本地计划
      return storage.getItem<Plan[]>(PLANS_STORAGE_KEY, []);
    }
  }

  /**
   * 添加新计划
   */
  async addPlan(plan: Plan): Promise<Plan> {
    try {
      // 尝试保存到API
      let apiSuccess = false;
      let apiPlan: Plan | null = null;

      try {
        console.log('Attempting to save plan to API with data:', plan);
        const response = await plansAPI.createPlan(plan);
        console.log('API response:', response);

        if (response && response.data) {
          apiPlan = response.data;
          apiSuccess = true;
          console.log('Plan saved to API successfully:', apiPlan);
        } else {
          console.warn('API response has no data:', response);
        }
      } catch (error: any) {
        console.error('Failed to save plan to API:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data
          } : 'No response',
          request: error.request ? 'Request exists' : 'No request'
        });
      }

      if (apiSuccess && apiPlan) {
        // 如果API保存成功，返回API计划
        return apiPlan;
      } else {
        // 如果API保存失败，保存到本地
        const localPlan: Plan = {
          ...plan,
          id: Date.now().toString() // 使用时间戳作为临时ID
        };

        // 获取现有计划并添加新计划
        const plans = storage.getItem<Plan[]>(PLANS_STORAGE_KEY, []);
        plans.push(localPlan);

        // 保存回本地存储
        storage.setItem(PLANS_STORAGE_KEY, plans);
        console.log('Plan saved to local storage:', localPlan);

        return localPlan;
      }
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
      // 尝试从API更新
      let apiSuccess = false;
      let updatedPlan: Plan | null = null;

      try {
        const response = await plansAPI.updatePlan(planId, planData);
        if (response && response.data) {
          updatedPlan = response.data;
          apiSuccess = true;
          console.log('Plan updated in API successfully:', updatedPlan);
        }
      } catch (error) {
        console.error('Failed to update plan in API:', error);
      }

      // 无论API是否成功，都更新本地存储
      const plans = storage.getItem<Plan[]>(PLANS_STORAGE_KEY, []);
      const planIndex = plans.findIndex(p => p.id === planId);

      if (planIndex >= 0) {
        // 更新本地计划
        plans[planIndex] = {
          ...plans[planIndex],
          ...planData
        };
        storage.setItem(PLANS_STORAGE_KEY, plans);
        console.log('Plan updated in local storage');

        // 如果API更新失败，返回本地更新的计划
        if (!apiSuccess) {
          updatedPlan = plans[planIndex];
        }
      }

      if (updatedPlan) {
        return updatedPlan;
      } else {
        throw new Error('Failed to update plan');
      }
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
      // 尝试从API删除
      let apiSuccess = false;

      try {
        await plansAPI.deletePlan(planId);
        apiSuccess = true;
        console.log('Plan deleted from API successfully');
      } catch (error) {
        console.error('Failed to delete plan from API:', error);
      }

      // 无论API是否成功，都从本地存储中删除
      const plans = storage.getItem<Plan[]>(PLANS_STORAGE_KEY, []);
      const updatedPlans = plans.filter(plan => plan.id !== planId);
      storage.setItem(PLANS_STORAGE_KEY, updatedPlans);

      console.log('Plan removed from local storage');
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }

  /**
   * 同步本地计划到API
   */
  private async syncLocalPlansToAPI(localPlans: Plan[], apiPlans: Plan[]): Promise<void> {
    // 获取需要同步的计划（本地有但API没有的）
    const plansToSync = localPlans.filter(localPlan =>
      !apiPlans.some(apiPlan => this.arePlansEqual(apiPlan, localPlan))
    );

    if (plansToSync.length === 0) {
      console.log('No plans need to be synced to API');
      return;
    }

    console.log(`Syncing ${plansToSync.length} plans to API`);

    // 同步每个计划
    const syncResults = await Promise.allSettled(
      plansToSync.map(plan => {
        // 创建一个新的计划对象，确保格式正确
        const apiPlan = {
          text: plan.text || plan.title || '', // 使用text字段，兼容title
          completed: plan.completed || false,
          started: plan.started || false
        };
        return plansAPI.createPlan(apiPlan);
      })
    );

    // 统计结果
    const succeeded = syncResults.filter(result => result.status === 'fulfilled').length;
    const failed = syncResults.filter(result => result.status === 'rejected').length;

    console.log(`Sync results: ${succeeded} succeeded, ${failed} failed`);

    // 更新本地存储（移除已成功同步的计划）
    if (succeeded > 0) {
      const remainingPlans = localPlans.filter(localPlan => {
        // 检查计划是否已在API中存在
        return !apiPlans.some(apiPlan => this.arePlansEqual(apiPlan, localPlan));
      });

      storage.setItem(PLANS_STORAGE_KEY, remainingPlans);
      console.log(`Updated local storage, ${remainingPlans.length} plans remaining`);
    }
  }

  /**
   * 检查两个计划是否相同
   */
  private arePlansEqual(plan1: Plan, plan2: Plan): boolean {
    // 如果有ID且相同，则认为是同一个计划
    if (plan1.id && plan2.id && plan1.id === plan2.id) {
      return true;
    }

    // 否则比较内容
    return (
      (plan1.title === plan2.title || plan1.text === plan2.title || plan1.title === plan2.text) &&
      (plan1.description === plan2.description) &&
      (plan1.completed === plan2.completed)
    );
  }
}

// 创建默认实例
export const planStorage = new PlanStorageService();

export default planStorage;
