import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import html2canvas from 'html2canvas';
import { POSTER_TEXT } from '../config/poster';
import apiService from '../services/apiService';
import { API_CONFIG } from '../config';
// 海报配置
const POSTER_CONFIG = {
    width: 750,
    height: 1334,
    padding: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff'
};
const props = defineProps();
const emit = defineEmits();
// 状态
const posterRef = ref(null);
const isGenerating = ref(false);
const generatedImageUrl = ref('');
const error = ref(null);
// 用户数据
const userData = ref({
    username: '',
    nickname: '',
    totalTasks: 0,
    completedTasks: 0,
    totalDuration: 0,
    registrationDate: '',
    streak: 0,
    dailyTasks: 0,
    dailyCompletedTasks: 0,
    dailyMinutes: 0,
    timeDistribution: [],
    dailyTasksList: [],
    taskTypeDistribution: []
});
// 计算属性
const posterTitle = computed(() => props.title || POSTER_TEXT.TITLE);
const posterSubtitle = computed(() => props.subtitle || POSTER_TEXT.SUBTITLE);
const completionRate = computed(() => {
    if (userData.value.dailyTasks === 0)
        return 0;
    return Math.round((userData.value.dailyCompletedTasks / userData.value.dailyTasks) * 100);
});
const totalHours = computed(() => Math.round(userData.value.totalDuration / 60));
const daysRegistered = computed(() => {
    if (!userData.value.registrationDate)
        return 0;
    const regDate = new Date(userData.value.registrationDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - regDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
// 格式化日期
const formattedDate = computed(() => {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
});
// 加载用户数据
const loadUserData = async () => {
    try {
        console.log('开始加载海报数据...', new Date().toLocaleTimeString());
        // 清空之前的数据，确保不会显示旧数据
        userData.value = {
            username: '',
            nickname: '',
            totalTasks: 0,
            completedTasks: 0,
            totalDuration: 0,
            registrationDate: '',
            streak: 0,
            dailyTasks: 0,
            dailyCompletedTasks: 0,
            dailyMinutes: 0,
            timeDistribution: [],
            dailyTasksList: [],
            taskTypeDistribution: []
        };
        // 获取当前用户信息
        try {
            console.log('获取当前用户信息...');
            const currentUserResponse = await apiService.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER);
            if (currentUserResponse?.data) {
                userData.value.username = currentUserResponse.data.username || '';
                userData.value.nickname = currentUserResponse.data.nickname || currentUserResponse.data.username || '学习达人';
                userData.value.registrationDate = currentUserResponse.data.created_at || new Date().toISOString();
                console.log('成功获取当前用户信息:', currentUserResponse.data);
            }
        }
        catch (err) {
            console.error('获取当前用户信息失败:', err);
        }
        // 获取用户统计数据
        try {
            console.log('获取用户统计数据...');
            const [totalStats, dailyStats] = await Promise.all([
                apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL),
                apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY)
            ]);
            if (totalStats?.data) {
                userData.value.totalTasks = totalStats.data.totalTasks || 0;
                userData.value.completedTasks = totalStats.data.completedTasks || 0;
                userData.value.totalDuration = totalStats.data.totalMinutes || 0;
                userData.value.streak = totalStats.data.streak || 0;
                console.log('成功获取总统计数据:', totalStats.data);
            }
            if (dailyStats?.data) {
                userData.value.dailyTasks = dailyStats.data.totalTasks || 0;
                userData.value.dailyCompletedTasks = dailyStats.data.completedTasks || 0;
                userData.value.dailyMinutes = dailyStats.data.totalMinutes || 0;
                userData.value.timeDistribution = dailyStats.data.timeDistribution || [];
                console.log('成功获取每日统计数据:', dailyStats.data);
            }
        }
        catch (err) {
            console.error('获取统计数据失败:', err);
        }
        // 获取今日任务列表
        try {
            console.log('获取今日任务列表...');
            const tasksResponse = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE, {
                params: {
                    date: new Date().toISOString().split('T')[0]
                }
            });
            if (tasksResponse?.data) {
                userData.value.dailyTasksList = tasksResponse.data.map((task) => ({
                    name: task.name,
                    completed: task.completed,
                    type: task.type || 'default',
                    duration: task.duration || 0
                }));
                // 计算任务类型分布
                const typeCount = {};
                userData.value.dailyTasksList.forEach((task) => {
                    typeCount[task.type] = (typeCount[task.type] || 0) + 1;
                });
                const total = userData.value.dailyTasksList.length;
                userData.value.taskTypeDistribution = Object.entries(typeCount).map(([type, count]) => ({
                    name: type,
                    percentage: Math.round((count / total) * 100),
                    color: getTaskTypeColor(type)
                }));
                console.log('成功获取任务列表:', userData.value.dailyTasksList);
            }
        }
        catch (err) {
            console.error('获取任务列表失败:', err);
        }
        // 如果没有数据，使用默认数据
        if (userData.value.dailyTasksList.length === 0) {
            userData.value.dailyTasksList = [
                { name: '学习任务', completed: true, type: 'study', duration: 30 },
                { name: '复习任务', completed: false, type: 'review', duration: 20 },
                { name: '练习任务', completed: false, type: 'practice', duration: 15 }
            ];
            userData.value.taskTypeDistribution = [
                { name: 'study', percentage: 60, color: '#3498db' },
                { name: 'review', percentage: 30, color: '#2ecc71' },
                { name: 'practice', percentage: 10, color: '#9b59b6' }
            ];
            console.log('使用默认任务数据');
        }
    }
    catch (err) {
        console.error('加载用户数据失败:', err);
        error.value = '加载数据失败，请稍后再试';
    }
};
// 辅助函数：获取任务类型对应的颜色
const getTaskTypeColor = (type) => {
    const colorMap = {
        study: '#3498db',
        review: '#2ecc71',
        practice: '#9b59b6',
        default: '#95a5a6'
    };
    return colorMap[type] || colorMap.default;
};
// 生成并显示海报
const generatePoster = async () => {
    try {
        console.log('开始生成海报...', new Date().toLocaleTimeString());
        isGenerating.value = true;
        error.value = null;
        // 确保数据已加载
        if (!userData.value.nickname) {
            await loadUserData();
        }
        // 等待DOM更新
        await nextTick();
        // 获取海报容器元素
        const posterElement = document.getElementById('poster-container');
        if (!posterElement) {
            throw new Error('找不到海报容器元素');
        }
        // 配置html2canvas选项
        const options = {
            scale: 2, // 提高清晰度
            useCORS: true, // 允许加载跨域图片
            backgroundColor: '#ffffff',
            logging: true,
            width: POSTER_CONFIG.width,
            height: POSTER_CONFIG.height,
            windowWidth: POSTER_CONFIG.width,
            windowHeight: POSTER_CONFIG.height,
            onclone: (clonedDoc) => {
                // 在克隆的文档中应用样式
                const clonedElement = clonedDoc.getElementById('poster-container');
                if (clonedElement) {
                    clonedElement.style.width = `${POSTER_CONFIG.width}px`;
                    clonedElement.style.height = `${POSTER_CONFIG.height}px`;
                    clonedElement.style.transform = 'none';
                    clonedElement.style.position = 'absolute';
                    clonedElement.style.left = '0';
                    clonedElement.style.top = '0';
                }
            }
        };
        console.log('开始渲染海报...');
        const canvas = await html2canvas(posterElement, options);
        console.log('海报渲染完成');
        // 转换为图片
        const image = canvas.toDataURL('image/png', 1.0);
        console.log('海报转换为图片完成');
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `学习记录_${userData.value.nickname}_${new Date().toLocaleDateString()}.png`;
        link.href = image;
        link.click();
        console.log('海报生成完成');
        return image;
    }
    catch (err) {
        console.error('生成海报失败:', err);
        error.value = '生成海报失败，请稍后再试';
        throw err;
    }
    finally {
        isGenerating.value = false;
    }
};
// 分享海报
const sharePoster = async () => {
    if (!generatedImageUrl.value)
        return;
    try {
        // 检查Web Share API是否可用
        if (navigator.share) {
            // 将Base64图片转换为Blob
            const response = await fetch(generatedImageUrl.value);
            const blob = await response.blob();
            const file = new File([blob], 'study-poster.png', { type: 'image/png' });
            await navigator.share({
                title: '我的学习海报',
                text: '查看我的学习进度！',
                files: [file]
            });
            console.log('海报分享成功');
        }
        else {
            // 如果Web Share API不可用，提供复制链接的选项
            // 这里简化处理，实际应用中可能需要先上传图片到服务器获取链接
            alert('您的浏览器不支持直接分享功能，请使用保存图片后手动分享');
            downloadPoster();
        }
    }
    catch (err) {
        console.error('分享海报失败:', err);
        alert('分享失败，请尝试保存图片后手动分享');
    }
};
// 下载海报
const downloadPoster = () => {
    if (!generatedImageUrl.value)
        return;
    const link = document.createElement('a');
    link.href = generatedImageUrl.value;
    link.download = `${posterTitle.value}-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
// 关闭模态框
const closeModal = () => {
    emit('close');
    // 重置状态
    generatedImageUrl.value = '';
    error.value = '';
};
// 组件挂载时加载数据
onMounted(() => {
    loadUserData();
    // 监听自动生成事件
    window.addEventListener('auto-generate-poster', autoGeneratePoster);
});
// 组件卸载时移除事件监听
onUnmounted(() => {
    window.removeEventListener('auto-generate-poster', autoGeneratePoster);
});
// 自动生成海报函数
const autoGeneratePoster = async () => {
    // 先确保数据已加载
    if (userData.value.dailyTasks === 0 && userData.value.totalTasks === 0) {
        console.log('数据尚未加载完成，正在加载...');
        await loadUserData();
        // 再等待一段时间确保数据处理完成
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    // 无论数据是否完整，都尝试生成海报
    console.log('开始生成海报，数据状态:', {
        dailyTasks: userData.value.dailyTasks,
        totalTasks: userData.value.totalTasks,
        taskTypeDistribution: userData.value.taskTypeDistribution?.length || 0,
        dailyTasksList: userData.value.dailyTasksList?.length || 0
    });
    generatePoster();
};
// 监听showModal变化，当打开时重新加载数据
watch(() => props.showModal, (newVal) => {
    if (newVal) {
        loadUserData();
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['poster-header']} */ ;
/** @type {__VLS_StyleScopedClasses['poster']} */ ;
/** @type {__VLS_StyleScopedClasses['poster']} */ ;
/** @type {__VLS_StyleScopedClasses['poster']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-title']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-title']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-title']} */ ;
/** @type {__VLS_StyleScopedClasses['data-item']} */ ;
/** @type {__VLS_StyleScopedClasses['data-item']} */ ;
/** @type {__VLS_StyleScopedClasses['data-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['task-item']} */ ;
/** @type {__VLS_StyleScopedClasses['task-status']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-color']} */ ;
/** @type {__VLS_StyleScopedClasses['wave-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['wave-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['wave-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-code']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-code']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-text']} */ ;
/** @type {__VLS_StyleScopedClasses['generated-poster']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['generate-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['download-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['share-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['regenerate-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['generate-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['download-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['share-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['regenerate-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['generate-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['download-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['share-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['regenerate-btn']} */ ;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=SharePoster.vue.js.map