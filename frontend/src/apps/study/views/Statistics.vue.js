import { ref, onMounted } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
// 导入服务
import { fetchAllStatistics, getContentStatsByView } from '../services';
import { STORAGE_CONFIG } from '../../../config';
// 注册ChartJS组件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);
// 统计数据
const dailyDuration = ref(0);
const weeklyDuration = ref(0);
const monthlyDuration = ref(0);
const totalHours = ref(0);
const hourlyStats = ref([]);
const weeklyStats = ref([]);
const monthlyStats = ref([]);
const heatmapData = ref([]);
const timeDistribution = ref([]);
const dailyContentStats = ref([]);
const weeklyContentStats = ref([]);
const monthlyContentStats = ref([]);
const userRegistrationDate = ref('');
const loading = ref(false);
const error = ref('');
// 当前视图
const currentView = ref('daily');
// 获取当前视图的内容统计数据
const currentContentStats = ref([]);
// 切换视图
const switchView = (view) => {
    currentView.value = view;
    updateContentStats();
};
// 更新内容统计数据
const updateContentStats = () => {
    currentContentStats.value = getContentStatsByView(currentView.value, dailyContentStats.value, weeklyContentStats.value, monthlyContentStats.value);
};
// 获取统计数据
const fetchStats = async () => {
    try {
        loading.value = true;
        error.value = '';
        // 使用统计数据服务获取数据
        const result = await fetchAllStatistics();
        // 更新组件状态
        dailyDuration.value = result.dailyDuration;
        weeklyDuration.value = result.weeklyDuration;
        monthlyDuration.value = result.monthlyDuration;
        totalHours.value = result.totalHours;
        hourlyStats.value = result.hourlyStats;
        weeklyStats.value = result.weeklyStats;
        monthlyStats.value = result.monthlyStats;
        heatmapData.value = result.heatmapData;
        timeDistribution.value = result.timeDistribution;
        userRegistrationDate.value = result.userRegistrationDate;
        // 使用真实的内容统计数据
        dailyContentStats.value = result.dailyContentStats || [];
        weeklyContentStats.value = result.weeklyContentStats || [];
        monthlyContentStats.value = result.monthlyContentStats || [];
        // 更新当前视图的内容统计数据
        updateContentStats();
    }
    catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('获取统计数据失败');
        }
        // 检查是否是认证错误（401）
        if (err.response && err.response.status === 401) {
            error.value = '获取统计数据需要登录权限，请确保您已登录';
            // 尝试重新获取认证令牌
            const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
            if (token) {
                try {
                    // 只处理JWT格式的令牌
                    if (token.includes('.')) {
                        const parts = token.split('.');
                        if (parts.length === 3) {
                            const base64Url = parts[1];
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                            const payload = JSON.parse(atob(base64));
                            if (payload.exp) {
                                const expTime = new Date(payload.exp * 1000);
                                const now = new Date();
                                if (expTime > now) {
                                    // 令牌有效，尝试自动重新获取数据
                                    setTimeout(() => {
                                        fetchStats();
                                    }, 1000);
                                    return;
                                }
                                else {
                                    // 令牌已过期，需要重新登录
                                    localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
                                    error.value = '登录已过期，请重新登录';
                                    // 重定向到登录页面
                                    window.location.href = '/login';
                                    return;
                                }
                            }
                        }
                    }
                    // 如果无法解析令牌，尝试重新获取数据
                    setTimeout(() => {
                        fetchStats();
                    }, 1000);
                }
                catch (e) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.warn('无法解析令牌');
                    }
                    error.value = '登录状态异常，请尝试重新登录';
                }
            }
            else {
                error.value = '未找到有效的登录凭证，请重新登录';
                // 重定向到登录页面
                window.location.href = '/login';
            }
        }
        else {
            error.value = err.message || '获取统计数据失败，请稍后再试';
        }
    }
    finally {
        loading.value = false;
    }
};
// 组件挂载时获取数据
onMounted(() => {
    fetchStats();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['statistics-container']} */ ;
/** @type {__VLS_StyleScopedClasses['statistics-container']} */ ;
/** @type {__VLS_StyleScopedClasses['time-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['time-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-message']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['heatmap-container']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-text']} */ ;
/** @type {__VLS_StyleScopedClasses['quote-container']} */ ;
/** @type {__VLS_StyleScopedClasses['section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['charts-row']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-column']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['time-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['time-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-column']} */ ;
/** @type {__VLS_StyleScopedClasses['quote']} */ ;
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
//# sourceMappingURL=Statistics.vue.js.map