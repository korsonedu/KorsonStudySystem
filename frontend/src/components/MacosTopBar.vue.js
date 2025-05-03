import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { userService } from '../services/userService';
const router = useRouter();
const currentDateTime = ref('');
const showUserDropdown = ref(false);
let clockInterval = null;
// 计算属性：是否已登录
const isLoggedIn = computed(() => userService.isLoggedIn.value);
// 计算属性：用户名
const username = computed(() => userService.currentUser.value?.username || '');
// 更新当前日期和时间
const updateDateTime = () => {
    const now = new Date();
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    currentDateTime.value = now.toLocaleDateString('zh-CN', options);
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
    // 暂时没有个人资料页面，可以根据需要添加
    // router.push('/profile');
};
// 退出登录
const logout = async () => {
    await userService.logout();
    showUserDropdown.value = false;
    router.push('/login');
};
// 组件挂载时
onMounted(() => {
    updateDateTime();
    // 每分钟更新一次时间
    clockInterval = window.setInterval(updateDateTime, 60000);
    // 添加点击事件监听器
    document.addEventListener('click', closeUserDropdown);
});
// 组件卸载时
onUnmounted(() => {
    if (clockInterval) {
        clearInterval(clockInterval);
    }
    document.removeEventListener('click', closeUserDropdown);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['app-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['datetime']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['app-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['username']} */ ;
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