/**
 * 计划服务
 * 提供计划相关的API调用和状态管理
 */
import { ref } from 'vue';
import { apiService } from './apiService';
import { API_CONFIG } from '../../config';
// 计划状态
const plans = ref([]);
const isLoading = ref(false);
const error = ref('');
/**
 * 计划服务
 */
export const planService = {
    // 响应式状态
    plans,
    isLoading,
    error,
    /**
     * 获取所有计划
     */
    async getPlans() {
        isLoading.value = true;
        error.value = '';
        try {
            console.log('Calling getPlans API...');
            const response = await apiService.get(API_CONFIG.ENDPOINTS.PLANS.BASE);
            console.log('Successfully fetched plans from API');
            plans.value = response.data;
            return response.data;
        }
        catch (err) {
            console.error('获取计划失败:', err);
            error.value = err.response?.data?.detail || '获取计划失败';
            // 返回空数组而不是抛出错误，以便前端可以继续运行
            console.log('Returning empty plans array due to API error');
            return [];
        }
        finally {
            isLoading.value = false;
        }
    },
    /**
     * 获取所有计划（别名，与 getPlans 相同）
     */
    async getAllPlans() {
        try {
            return await this.getPlans();
        }
        catch (error) {
            console.error('获取所有计划失败:', error);
            return [];
        }
    },
    /**
     * 获取单个计划
     * @param id 计划ID
     */
    async getPlan(id) {
        isLoading.value = true;
        error.value = '';
        try {
            const response = await apiService.get(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${id}`);
            return response.data;
        }
        catch (err) {
            console.error(`获取计划 ${id} 失败:`, err);
            error.value = err.response?.data?.detail || '获取计划失败';
            throw err;
        }
        finally {
            isLoading.value = false;
        }
    },
    /**
     * 创建计划
     * @param plan 计划数据
     */
    async createPlan(plan) {
        isLoading.value = true;
        error.value = '';
        try {
            const response = await apiService.post(API_CONFIG.ENDPOINTS.PLANS.BASE, plan);
            // 更新本地计划列表
            plans.value = [...plans.value, response.data];
            return response.data;
        }
        catch (err) {
            console.error('创建计划失败:', err);
            error.value = err.response?.data?.detail || '创建计划失败';
            throw err;
        }
        finally {
            isLoading.value = false;
        }
    },
    /**
     * 添加计划（别名，与 createPlan 相同）
     * @param plan 计划数据
     */
    async addPlan(plan) {
        return this.createPlan(plan);
    },
    /**
     * 更新计划
     * @param id 计划ID
     * @param plan 计划数据
     */
    async updatePlan(id, plan) {
        isLoading.value = true;
        error.value = '';
        try {
            const response = await apiService.put(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${id}`, plan);
            // 更新本地计划列表
            const index = plans.value.findIndex(p => p.id === id);
            if (index !== -1) {
                plans.value[index] = response.data;
                plans.value = [...plans.value];
            }
            return response.data;
        }
        catch (err) {
            console.error(`更新计划 ${id} 失败:`, err);
            error.value = err.response?.data?.detail || '更新计划失败';
            throw err;
        }
        finally {
            isLoading.value = false;
        }
    },
    /**
     * 删除计划
     * @param id 计划ID
     */
    async deletePlan(id) {
        isLoading.value = true;
        error.value = '';
        try {
            await apiService.delete(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${id}`);
            // 更新本地计划列表
            plans.value = plans.value.filter(p => p.id !== id);
            return true;
        }
        catch (err) {
            console.error(`删除计划 ${id} 失败:`, err);
            error.value = err.response?.data?.detail || '删除计划失败';
            throw err;
        }
        finally {
            isLoading.value = false;
        }
    },
    /**
     * 完成计划
     * @param id 计划ID
     */
    async completePlan(id) {
        isLoading.value = true;
        error.value = '';
        try {
            const plan = { completed: true };
            const response = await apiService.put(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${id}`, plan);
            // 更新本地计划列表
            const index = plans.value.findIndex(p => p.id === id);
            if (index !== -1) {
                plans.value[index] = response.data;
                plans.value = [...plans.value];
            }
            return response.data;
        }
        catch (err) {
            console.error(`完成计划 ${id} 失败:`, err);
            error.value = err.response?.data?.detail || '完成计划失败';
            throw err;
        }
        finally {
            isLoading.value = false;
        }
    },
    /**
     * 开始计划
     * @param id 计划ID
     */
    async startPlan(id) {
        isLoading.value = true;
        error.value = '';
        try {
            const plan = { started: true };
            const response = await apiService.put(`${API_CONFIG.ENDPOINTS.PLANS.BASE}/${id}`, plan);
            // 更新本地计划列表
            const index = plans.value.findIndex(p => p.id === id);
            if (index !== -1) {
                plans.value[index] = response.data;
                plans.value = [...plans.value];
            }
            return response.data;
        }
        catch (err) {
            console.error(`开始计划 ${id} 失败:`, err);
            error.value = err.response?.data?.detail || '开始计划失败';
            throw err;
        }
        finally {
            isLoading.value = false;
        }
    }
};
export default planService;
//# sourceMappingURL=planService.js.map