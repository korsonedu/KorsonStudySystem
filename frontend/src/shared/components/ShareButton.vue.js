import { ref } from 'vue';
const props = defineProps();
// 状态
const isSharing = ref(false);
const shareResult = ref('');
const showTooltip = ref(false);
// 分享方法
const share = async () => {
    isSharing.value = true;
    shareResult.value = '';
    try {
        // 检查Web Share API是否可用
        if (navigator.share) {
            await navigator.share({
                title: props.title || document.title,
                text: props.text || '查看我的学习进度',
                url: props.url || window.location.href
            });
            shareResult.value = '分享成功！';
        }
        else {
            // 如果Web Share API不可用，复制链接到剪贴板
            await copyToClipboard();
            shareResult.value = '链接已复制到剪贴板';
        }
        // 显示提示
        showTooltip.value = true;
        setTimeout(() => {
            showTooltip.value = false;
        }, 2000);
    }
    catch (error) {
        console.error('分享失败:', error);
        shareResult.value = '分享失败，请手动复制链接';
        // 显示提示
        showTooltip.value = true;
        setTimeout(() => {
            showTooltip.value = false;
        }, 2000);
    }
    finally {
        isSharing.value = false;
    }
};
// 复制到剪贴板
const copyToClipboard = async () => {
    const url = props.url || window.location.href;
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            return true;
        }
        else {
            // 兼容性处理
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }
    catch (err) {
        console.error('复制失败:', err);
        return false;
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['share-button']} */ ;
/** @type {__VLS_StyleScopedClasses['share-button']} */ ;
/** @type {__VLS_StyleScopedClasses['share-button']} */ ;
/** @type {__VLS_StyleScopedClasses['share-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['share-button']} */ ;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=ShareButton.vue.js.map