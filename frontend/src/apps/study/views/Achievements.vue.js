import { ref, onMounted, onUnmounted, computed } from 'vue';
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
// 存储上一次的成就状态，用于检测新解锁的成就
const previousAchievements = ref([]);
// Fetch achievements
const fetchAchievements = async () => {
    try {
        loading.value = true;
        error.value = '';
        const response = await api.get('/api/achievements');
        if (response.data && response.data.status === 'success') {
            // 处理后端返回的成就数据
            const backendAchievements = response.data.achievements || [];
            userStats.value = response.data.user_stats || {};
            // 保存上一次的成就状态
            const oldAchievements = [...achievements.value];
            // 将后端数据与前端定义结合
            const newAchievements = ACHIEVEMENTS.map(frontendAchievement => {
                // 查找对应的后端成就数据
                const backendAchievement = backendAchievements.find((ba) => ba.id === frontendAchievement.id);
                if (backendAchievement) {
                    // 处理等级信息
                    const levels = frontendAchievement.levels.map((level, index) => {
                        const backendLevel = backendAchievement.levels[index];
                        return {
                            id: index + 1,
                            level: level.level,
                            description: level.description,
                            unlocked: backendLevel ? backendLevel.unlocked : false,
                            unlockedAt: backendLevel ? backendLevel.unlocked_at : null
                        };
                    });
                    // 返回合并后的成就数据
                    return {
                        id: frontendAchievement.id,
                        name: frontendAchievement.name,
                        description: frontendAchievement.description,
                        icon: frontendAchievement.icon,
                        unlocked: backendAchievement.is_unlocked,
                        progress: calculateProgress(backendAchievement),
                        currentLevel: backendAchievement.highest_level,
                        maxLevel: frontendAchievement.levels.length,
                        levels: levels
                    };
                }
                else {
                    // 如果后端没有对应数据，使用前端默认值
                    return {
                        id: frontendAchievement.id,
                        name: frontendAchievement.name,
                        description: frontendAchievement.description,
                        icon: frontendAchievement.icon,
                        unlocked: false,
                        progress: 0,
                        currentLevel: 0,
                        maxLevel: frontendAchievement.levels.length,
                        levels: frontendAchievement.levels.map((level, index) => ({
                            id: index + 1,
                            level: level.level,
                            description: level.description,
                            unlocked: false,
                            unlockedAt: null
                        }))
                    };
                }
            });
            // 检查是否有新解锁的成就
            if (achievements.value.length > 0) {
                newAchievements.forEach(newAchievement => {
                    const oldAchievement = achievements.value.find(a => a.id === newAchievement.id);
                    // 如果成就是新解锁的或者等级提升了
                    if (oldAchievement &&
                        (!oldAchievement.unlocked && newAchievement.unlocked ||
                            newAchievement.currentLevel > oldAchievement.currentLevel)) {
                        // 显示解锁通知
                        showUnlockNotification(newAchievement);
                    }
                });
            }
            // 更新成就列表
            achievements.value = newAchievements;
        }
        else {
            throw new Error(response.data?.message || '获取成就数据失败');
        }
        loading.value = false;
    }
    catch (err) {
        console.error('Error fetching achievements:', err);
        error.value = err.response?.data?.detail || err.message || '获取成就数据失败，请稍后再试';
        loading.value = false;
        // 即使出错，也确保初始化数据
        achievements.value = ACHIEVEMENTS.map(achievement => ({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            unlocked: false,
            progress: 0,
            currentLevel: 0,
            maxLevel: achievement.levels.length,
            levels: achievement.levels.map((level, index) => ({
                id: index + 1,
                level: level.level,
                description: level.description,
                unlocked: false,
                unlockedAt: null
            }))
        }));
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
// Toggle achievement expansion
const toggleExpand = (id) => {
    expandedId.value = expandedId.value === id ? null : id;
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
    // 阻止事件冒泡
    event.stopPropagation();
    // 如果成就未解锁，不执行任何操作
    if (!unlocked) {
        return;
    }
    // 如果点击的是当前展开的成就，则收起
    if (expandedId.value === id) {
        expandedId.value = null;
    }
    else {
        // 如果有其他展开的成就，先将其收起
        if (expandedId.value !== null) {
            // 使用 setTimeout 确保先收起当前展开的成就，再展开新的成就
            expandedId.value = null;
            setTimeout(() => {
                expandedId.value = id;
            }, 50);
        }
        else {
            // 如果没有展开的成就，直接展开点击的成就
            expandedId.value = id;
        }
    }
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
/** @type {__VLS_StyleScopedClasses['progress-container']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['locked']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['unlock-button']} */ ;
/** @type {__VLS_StyleScopedClasses['unlock-button']} */ ;
/** @type {__VLS_StyleScopedClasses['unlock-button']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['locked']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
/** @type {__VLS_StyleScopedClasses['locked-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['locked-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['description']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
/** @type {__VLS_StyleScopedClasses['description']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-text']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-container']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-container']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-container']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-container']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['level-number']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['level-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['level-status']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['locked']} */ ;
/** @type {__VLS_StyleScopedClasses['level-status']} */ ;
/** @type {__VLS_StyleScopedClasses['achievements-list']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-content']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-content']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-close']} */ ;
/** @type {__VLS_StyleScopedClasses['achievements-list']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['achievements-header']} */ ;
/** @type {__VLS_StyleScopedClasses['achievements-list']} */ ;
/** @type {__VLS_StyleScopedClasses['locked-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['locked-text']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-notification']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-overview']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
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