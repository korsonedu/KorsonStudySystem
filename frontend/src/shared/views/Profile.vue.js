import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { API_CONFIG } from '../../config';
import axios from 'axios';
const router = useRouter();
const isEditing = ref(false);
const isEditingExam = ref(false);
const userInfo = ref({
    id: 0,
    username: '',
    email: '',
    is_active: true,
    is_superuser: false,
    created_at: '',
    email_verified: false,
    avatar: ''
});
const userStats = ref({
    totalStudyTime: 0,
    completedTasks: 0,
    unlockedAchievements: 0,
    studyDays: 0
});
const editForm = ref({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
});
// 考研信息
const examInfo = ref({
    targetSchool: '',
    targetMajor: '',
    examYear: '',
    prepPhase: '',
    dailyGoal: null
});
const examEditForm = ref({
    targetSchool: '',
    targetMajor: '',
    examYear: '',
    prepPhase: '',
    dailyGoal: null
});
// 计算用户名首字母作为头像
const userInitials = computed(() => {
    if (!userInfo.value.username)
        return '?';
    return userInfo.value.username.charAt(0).toUpperCase();
});
// 格式化日期
const formatDate = (dateString) => {
    if (!dateString)
        return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
// 格式化时长
const formatDuration = (minutes) => {
    if (minutes < 60) {
        return `${minutes} 分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} 小时 ${remainingMinutes} 分钟`;
};
// 获取用户信息
const fetchUserInfo = async () => {
    try {
        const response = await authService.getCurrentUser();
        if (response) {
            userInfo.value = response;
            console.log('获取到用户信息:', userInfo.value);
        }
    }
    catch (error) {
        console.error('获取用户信息失败:', error);
    }
};
// 获取用户统计数据
const fetchUserStats = async () => {
    try {
        // 获取任务统计
        const tasksResponse = await axios.get(`${API_CONFIG.BASE_URL}/api/study/statistics/tasks`);
        if (tasksResponse.data) {
            userStats.value.totalStudyTime = tasksResponse.data.total_duration || 0;
            userStats.value.completedTasks = tasksResponse.data.total_tasks || 0;
            userStats.value.studyDays = tasksResponse.data.unique_days || 0;
        }
        // 获取成就统计
        const achievementsResponse = await axios.get(`${API_CONFIG.BASE_URL}/api/study/achievements`);
        if (achievementsResponse.data) {
            userStats.value.unlockedAchievements = achievementsResponse.data.filter((achievement) => achievement.unlocked).length;
        }
    }
    catch (error) {
        console.error('获取用户统计数据失败:', error);
    }
};
// 开始编辑
const startEditing = () => {
    editForm.value.username = userInfo.value.username;
    editForm.value.email = userInfo.value.email || '';
    editForm.value.password = '';
    editForm.value.confirmPassword = '';
    isEditing.value = true;
};
// 取消编辑
const cancelEditing = () => {
    isEditing.value = false;
};
// 保存个人资料
const saveProfile = async () => {
    // 验证密码
    if (editForm.value.password && editForm.value.password !== editForm.value.confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    try {
        const updateData = {
            username: editForm.value.username,
            email: editForm.value.email
        };
        // 如果输入了密码，则更新密码
        if (editForm.value.password) {
            updateData.password = editForm.value.password;
        }
        // 调用API更新用户信息
        await axios.put(`${API_CONFIG.BASE_URL}/api/users/me`, updateData);
        // 更新成功后刷新用户信息
        await fetchUserInfo();
        isEditing.value = false;
        alert('个人资料更新成功');
    }
    catch (error) {
        console.error('更新个人资料失败:', error);
        alert(`更新失败: ${error.response?.data?.detail || '未知错误'}`);
    }
};
// 开始编辑考研信息
const startEditingExam = () => {
    examEditForm.value.targetSchool = examInfo.value.targetSchool || '';
    examEditForm.value.targetMajor = examInfo.value.targetMajor || '';
    examEditForm.value.examYear = examInfo.value.examYear || '';
    examEditForm.value.prepPhase = examInfo.value.prepPhase || '';
    examEditForm.value.dailyGoal = examInfo.value.dailyGoal || null;
    isEditingExam.value = true;
};
// 取消编辑考研信息
const cancelEditingExam = () => {
    isEditingExam.value = false;
};
// 保存考研信息
const saveExamInfo = () => {
    // 更新考研信息
    examInfo.value = { ...examEditForm.value };
    // 保存到本地存储
    localStorage.setItem('examInfo', JSON.stringify(examInfo.value));
    isEditingExam.value = false;
};
// 从本地存储加载考研信息
const loadExamInfo = () => {
    const savedExamInfo = localStorage.getItem('examInfo');
    if (savedExamInfo) {
        try {
            examInfo.value = JSON.parse(savedExamInfo);
        }
        catch (error) {
            console.error('加载考研信息失败:', error);
        }
    }
};
// 组件挂载时获取用户信息和统计数据
onMounted(async () => {
    // 检查用户是否已登录
    if (!userService.isLoggedIn.value) {
        router.push('/login');
        return;
    }
    await fetchUserInfo();
    await fetchUserStats();
    loadExamInfo();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['avatar-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-section']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['form-item']} */ ;
/** @type {__VLS_StyleScopedClasses['form-item']} */ ;
/** @type {__VLS_StyleScopedClasses['form-item']} */ ;
/** @type {__VLS_StyleScopedClasses['form-item']} */ ;
/** @type {__VLS_StyleScopedClasses['form-item']} */ ;
/** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-header']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
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
//# sourceMappingURL=Profile.vue.js.map