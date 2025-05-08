import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { userService } from '../../shared/services/userService';
import { authService } from '../../shared/services/authService';
const router = useRouter();
const currentDateTime = ref('');
const showUserDropdown = ref(false);
let clockInterval = null;
// 确认对话框状态
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('退出登录');
const confirmDialogMessage = ref('确定要退出登录吗？');
// 计算属性：是否已登录
const isLoggedIn = computed(() => {
    // 优先使用 authService，如果 authService 显示未登录，则检查 userService
    const authLoggedIn = authService.isLoggedIn.value;
    const userLoggedIn = userService.isLoggedIn.value;
    console.log('MacosTopBar - authService.isLoggedIn:', authLoggedIn);
    console.log('MacosTopBar - userService.isLoggedIn:', userLoggedIn);
    return authLoggedIn || userLoggedIn;
});
// 计算属性：用户名
const username = computed(() => {
    // 优先使用 authService 的用户名，如果没有则使用 userService 的用户名
    const authUsername = authService.currentUser.value?.username;
    const userUsername = userService.currentUser.value?.username;
    console.log('MacosTopBar - authService.username:', authUsername);
    console.log('MacosTopBar - userService.username:', userUsername);
    return authUsername || userUsername || '';
});
// 更新当前日期和时间
const updateDateTime = () => {
    const now = new Date();
    // 格式化日期和时间 - 使用中文格式
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    // 获取星期几
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[now.getDay()];
    // 组合成最终格式
    currentDateTime.value = `${month}月${day}日 ${weekday} ${hour}:${minute}`;
};
// 判断当前应用
const isCurrentApp = (appName) => {
    // 根据路由判断当前应用
    if (appName === 'study') {
        return true; // 目前只有学习追踪应用
    }
    return false;
};
// 切换用户下拉菜单
const toggleUserDropdown = () => {
    showUserDropdown.value = !showUserDropdown.value;
};
// 关闭用户下拉菜单（点击外部区域时）
const closeUserDropdown = (event) => {
    const target = event.target;
    if (!target.closest('.user-menu')) {
        showUserDropdown.value = false;
    }
};
// 跳转到个人资料页面
const goToProfile = () => {
    showUserDropdown.value = false;
    router.push('/profile');
};
// 退出登录
const handleLogout = () => {
    console.log('退出登录 - 开始');
    console.log('showConfirmDialog 之前:', showConfirmDialog.value);
    // 关闭用户下拉菜单
    showUserDropdown.value = false;
    // 显示确认对话框
    showConfirmDialog.value = true;
    console.log('showConfirmDialog 之后:', showConfirmDialog.value);
    console.log('退出登录 - 结束');
};
// 确认退出登录
const confirmLogout = () => {
    console.log('确认退出登录 - 开始');
    try {
        // 清除所有本地存储
        console.log('清除localStorage前:', Object.keys(localStorage));
        localStorage.clear();
        console.log('清除localStorage后:', Object.keys(localStorage));
        console.log('清除sessionStorage前:', Object.keys(sessionStorage));
        sessionStorage.clear();
        console.log('清除sessionStorage后:', Object.keys(sessionStorage));
        // 清除所有cookie
        console.log('清除cookies前:', document.cookie);
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
            if (name) {
                console.log('清除cookie:', name);
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }
        }
        console.log('清除cookies后:', document.cookie);
        // 重置服务状态
        console.log('重置authService前:', authService.currentUser.value);
        if (authService && authService.currentUser) {
            authService.currentUser.value = null;
        }
        console.log('重置authService后:', authService.currentUser.value);
        console.log('重置userService前:', userService.currentUser.value);
        if (userService && userService.currentUser) {
            userService.currentUser.value = null;
        }
        console.log('重置userService后:', userService.currentUser.value);
        // 隐藏确认对话框
        showConfirmDialog.value = false;
        console.log('确认退出登录 - 结束，即将重定向到登录页面');
        // 使用setTimeout确保日志能显示完成
        setTimeout(() => {
            // 重定向到登录页面
            window.location.href = '/login';
        }, 500);
    }
    catch (error) {
        console.error('退出登录时发生错误:', error);
        showConfirmDialog.value = false;
    }
};
// 取消退出登录
const cancelLogout = () => {
    console.log('取消退出登录');
    // 隐藏确认对话框
    showConfirmDialog.value = false;
};
// 组件挂载时
onMounted(() => {
    // 立即更新一次时间
    updateDateTime();
    // 计算到下一分钟的毫秒数
    const now = new Date();
    const nextMinute = new Date(now);
    nextMinute.setSeconds(0, 0);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);
    const delay = nextMinute.getTime() - now.getTime();
    // 首先设置一个定时器，在下一分钟整点触发
    setTimeout(() => {
        // 更新时间
        updateDateTime();
        // 然后设置每分钟更新一次的定时器
        clockInterval = window.setInterval(updateDateTime, 60000);
    }, delay);
    // 添加点击事件监听器
    document.addEventListener('click', closeUserDropdown);
});
// 组件卸载时
onUnmounted(() => {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
    document.removeEventListener('click', closeUserDropdown);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['app-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['app-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-button']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-button']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['register-button']} */ ;
/** @type {__VLS_StyleScopedClasses['datetime']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['user-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['app-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['datetime']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-button']} */ ;
/** @type {__VLS_StyleScopedClasses['app-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['username']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['datetime']} */ ;
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
//# sourceMappingURL=MacosTopBar.vue.js.map