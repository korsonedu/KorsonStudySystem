import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { userService } from '../services/userService';
const router = useRouter();
const showUserMenu = ref(false);
const showPosterModal = ref(false);
const generatedImageUrl = ref('');
// 使用用户服务的响应式状态
const username = computed(() => userService.currentUser.value?.username || '');
const isLoggedIn = computed(() => userService.isLoggedIn.value);
// 登出
const logout = async () => {
    await userService.logout();
    showUserMenu.value = false;
    router.push('/login');
};
// 切换用户菜单显示状态
const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value;
};
// 显示海报生成模态框
const showPoster = () => {
    showPosterModal.value = true;
    // 在下一个事件循环中触发自动生成
    setTimeout(() => {
        // 通过事件总线或其他方式触发自动生成
        window.dispatchEvent(new CustomEvent('auto-generate-poster'));
    }, 100);
};
// 处理海报生成完成事件
const handlePosterGenerated = (imageUrl) => {
    generatedImageUrl.value = imageUrl;
};
// 监听点击事件，如果点击的不是用户菜单，则关闭菜单
const handleClickOutside = (event) => {
    const target = event.target;
    if (!target.closest('.user-menu') && !target.closest('.user-btn')) {
        showUserMenu.value = false;
    }
};
// 添加点击事件监听器
document.addEventListener('click', handleClickOutside);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['nav-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['navbar']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-container']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['user-container']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-btn']} */ ;
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
//# sourceMappingURL=NavBar.vue.js.map