/**
 * 成就服务
 * 用于获取成就定义和用户成就状态
 */
import { ref, computed } from 'vue'
import { apiService } from './apiService'
import { API_CONFIG } from '../../config/api'
import { ACHIEVEMENTS } from '../../config/achievements'
import eventBus, { EVENT_NAMES } from '../../utils/eventBus'

// 状态
const isLoading = ref(false)
const error = ref('')
const achievements = ref<any[]>([])
const achievementDefinitions = ref<any[]>([])
const isDefinitionsLoaded = ref(false)

// 计算属性
const unlockedAchievements = computed(() => {
  return achievements.value.filter(a => a.is_unlocked)
})

/**
 * 成就服务
 * 提供成就相关的功能
 */
export const achievementService = {
  // 状态
  isLoading,
  error,
  achievements,
  achievementDefinitions,
  isDefinitionsLoaded,

  // 计算属性
  unlockedAchievements,

  /**
   * 获取用户成就
   * 从API获取用户的成就状态
   */
  async getUserAchievements() {
    isLoading.value = true
    error.value = ''

    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.BASE)
      achievements.value = response.data.achievements || []
      return achievements.value
    } catch (err: any) {
      console.error('获取用户成就失败:', err)
      error.value = err.response?.data?.detail || '获取成就失败'
      throw err
    } finally {
      isLoading.value = false
    }
  },

  /**
   * 获取成就定义
   * 从API获取所有成就的定义（名称、描述、等级等）
   */
  async getAchievementDefinitions() {
    if (isDefinitionsLoaded.value) {
      return achievementDefinitions.value
    }

    isLoading.value = true
    error.value = ''

    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.ACHIEVEMENTS.BASE}/definitions`)
      achievementDefinitions.value = response.data.achievements || []
      isDefinitionsLoaded.value = true

      // 如果API请求失败，使用本地定义作为备份
      // 注意：本地定义(ACHIEVEMENTS)仅作为备份，主要数据源是后端API
      if (!achievementDefinitions.value.length) {
        console.warn('使用本地成就定义作为备份 - 这些数据可能不是最新的')
        achievementDefinitions.value = ACHIEVEMENTS
      }

      return achievementDefinitions.value
    } catch (err: any) {
      console.error('获取成就定义失败:', err)
      console.warn('使用本地成就定义作为备份 - 这些数据可能不是最新的')
      console.warn('如需更新成就定义，请确保后端服务正常运行')
      achievementDefinitions.value = ACHIEVEMENTS
      isDefinitionsLoaded.value = true
      error.value = err.response?.data?.detail || '获取成就定义失败'
      return achievementDefinitions.value
    } finally {
      isLoading.value = false
    }
  },

  /**
   * 获取成就图标
   * @param id 成就ID
   * @returns 成就图标
   */
  getAchievementIcon(id: number) {
    const icons: Record<number, string> = {
      1: '💰', // 金融启蒙者
      2: '🌙', // 夜间交易员
      3: '📈', // 巴菲特的学徒
      4: '🌅', // 晨间市场分析师
      5: '📊', // 长线投资者
      6: '📚', // 知识投资组合管理者
      7: '🚀', // 高效执行交易员
      8: '🧠', // 深度研究分析师
      9: '🎯', // 周末金融学者
      10: '⚡', // 高频学习交易员
      11: '🌍', // 宏观经济学大师
      12: '🔬', // 微观经济学探索者
      13: '📊', // 计量经济学统计大师
      14: '💵', // 货币银行学专家
      15: '🌐', // 国际金融理论家
      16: '🏢', // 公司金融策略师
      17: '💎', // 投资学精算师
      18: '🔄', // 金融衍生品工程师
      19: '🛡️', // 风险管理守护者
      20: '🤖', // 金融科技创新者
    }

    return icons[id] || '🏆'
  }
}
