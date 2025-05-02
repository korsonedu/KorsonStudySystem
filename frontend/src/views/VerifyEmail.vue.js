import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiService } from '../services/apiService';
const router = useRouter();
const route = useRoute();
const status = ref('verifying');
const message = ref('正在验证您的邮箱...');
const errorDetails = ref('');
// 验证邮箱
const verifyEmail = async (token) => {
    try {
        status.value = 'verifying';
        message.value = '正在验证您的邮箱...';
        // 调用验证邮箱API
        // 使用POST请求，因为后端验证邮箱的路由是POST方法
        const response = await apiService.post('/api/auth/verify-email', { token });
        // 验证成功
        status.value = 'success';
        message.value = '邮箱验证成功！您现在可以登录了。';
        // 3秒后跳转到登录页
        setTimeout(() => {
            router.push('/login');
        }, 3000);
    }
    catch (error) {
        // 验证失败
        status.value = 'error';
        message.value = '邮箱验证失败';
        errorDetails.value = error.response?.data?.detail || '验证链接无效或已过期，请重新注册或联系管理员。';
        console.error('Email verification error:', error);
    }
};
// 组件挂载时自动验证
onMounted(() => {
    const token = route.query.token;
    if (!token) {
        status.value = 'error';
        message.value = '验证失败';
        errorDetails.value = '缺少验证令牌，请检查您的验证链接是否完整。';
        return;
    }
    verifyEmail(token);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
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
//# sourceMappingURL=VerifyEmail.vue.js.map