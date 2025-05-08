import { ref, onMounted, onUnmounted, computed } from 'vue';
import studyApi from '../services/studyApi';
import { ACHIEVEMENTS } from '../../../config/achievements';
// Achievements data
const achievements = ref([]);
const expandedId = ref(null);
const loading = ref(false);
const error = ref('');
const userStats = ref(null);
// 通知相关
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationTimeout = ref(null);
// Fetch achievements
const fetchAchievements = async () => {
    try {
        loading.value = true;
        error.value = '';
        console.log('正在获取成就数据...');
        const response = await studyApi.achievements.getAchievements();
        console.log('成就数据获取成功:', response.data);
        if (response.data) {
            // 处理后端返回的成就数据
            const backendAchievements = response.data.achievements || [];
            userStats.value = response.data.user_stats || {};
            // 使用后端数据，结合前端定义的名称和描述
            achievements.value = backendAchievements.map((backendAchievement) => {
                // 查找对应的前端成就定义
                const frontendAchievement = ACHIEVEMENTS.find((fa) => fa.id === backendAchievement.id) || {
                    id: backendAchievement.id,
                    name: backendAchievement.name || `成就 #${backendAchievement.id}`,
                    description: backendAchievement.description || '',
                    icon: '🏆',
                    levels: []
                };
                // 处理等级信息
                const levels = backendAchievement.levels.map((backendLevel, index) => {
                    const frontendLevel = frontendAchievement.levels[index] || {
                        level: index + 1,
                        description: backendLevel.description || `等级 ${index + 1}`
                    };
                    return {
                        id: index + 1,
                        level: frontendLevel.level,
                        description: frontendLevel.description,
                        unlocked: backendLevel.unlocked,
                        unlockedAt: backendLevel.unlocked_at
                    };
                });
                // 返回成就数据
                return {
                    id: backendAchievement.id,
                    name: frontendAchievement.name,
                    description: frontendAchievement.description,
                    icon: frontendAchievement.icon,
                    unlocked: backendAchievement.is_unlocked,
                    progress: calculateProgress(backendAchievement),
                    currentLevel: backendAchievement.highest_level,
                    maxLevel: levels.length,
                    levels: levels
                };
            });
        }
        else {
            throw new Error('获取成就数据失败');
        }
        loading.value = false;
    }
    catch (err) {
        console.error('Error fetching achievements:', err);
        error.value = err.response?.data?.detail || err.message || '获取成就数据失败，请稍后再试';
        loading.value = false;
        // 出错时不使用模拟数据，显示错误信息
        achievements.value = [];
    }
};
// 计算成就进度百分比
const calculateProgress = (achievement) => {
    if (!achievement)
        return 0;
    const unlockedLevels = achievement.levels.filter((l) => l.unlocked).length;
    const totalLevels = achievement.levels.length;
    return totalLevels > 0 ? Math.round((unlockedLevels / totalLevels) * 100) : 0;
};
// 计算已解锁成就数量
const unlockedCount = computed(() => {
    return achievements.value.filter(a => a.unlocked).length;
});
// 计算总成就数量
const totalCount = computed(() => {
    return achievements.value.length;
});
// 计算总进度
const totalProgress = computed(() => {
    if (totalCount.value === 0)
        return 0;
    return Math.round((unlockedCount.value / totalCount.value) * 100);
});
// 刷新成就数据
const refreshAchievements = () => {
    fetchAchievements();
};
// 切换成就展开/收起状态
const toggleAchievement = (id, event, unlocked) => {
    // 如果成就未解锁，不执行任何操作
    if (!unlocked) {
        return;
    }
    // 切换展开状态
    expandedId.value = expandedId.value === id ? null : id;
};
// 点击空白处关闭展开的卡片
const handleOutsideClick = (event) => {
    // 如果没有展开的卡片，不做任何处理
    if (expandedId.value === null)
        return;
    // 检查点击的元素是否在展开的卡片内
    const expandedCard = document.querySelector('.achievement-card.expanded');
    if (expandedCard && !expandedCard.contains(event.target)) {
        expandedId.value = null;
    }
};
// 成就解锁通知
const showUnlockNotification = (achievement) => {
    // 清除之前的定时器
    if (notificationTimeout.value) {
        clearTimeout(notificationTimeout.value);
    }
    // 设置通知内容
    notificationMessage.value = `恭喜您解锁了"${achievement.name}"成就！`;
    showNotification.value = true;
    // 5秒后自动关闭通知
    notificationTimeout.value = window.setTimeout(() => {
        hideNotification();
    }, 5000);
};
// 隐藏通知
const hideNotification = () => {
    showNotification.value = false;
};
// Load data on component mount
onMounted(() => {
    fetchAchievements();
    // 添加点击事件监听器，用于点击空白处关闭展开的卡片
    document.addEventListener('click', handleOutsideClick);
});
// 组件卸载时移除事件监听器
onUnmounted(() => {
    document.removeEventListener('click', handleOutsideClick);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-section']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-overview']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['retry-button']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-content']} */ ;
/** @type {__VLS_StyleScopedClasses['close-button']} */ ;
/** @type {__VLS_StyleScopedClasses['achievements-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['achievements-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['achievements-container']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-section']} */ ;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=Achievements.vue.js.map