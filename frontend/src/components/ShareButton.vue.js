import { ref } from 'vue';
const props = defineProps();
const isSharing = ref(false);
const shareSuccess = ref(false);
const shareError = ref(false);
const showPosterModal = ref(false);
const generatedImageUrl = ref('');
// 分享功能
const share = async () => {
    isSharing.value = true;
    shareSuccess.value = false;
    shareError.value = false;
    try {
        // 检查浏览器是否支持Web Share API
        if (navigator.share) {
            // 如果有生成的海报图片，则分享图片
            if (generatedImageUrl.value) {
                // 创建一个Blob对象
                const response = await fetch(generatedImageUrl.value);
                const blob = await response.blob();
                // 创建一个File对象
                const file = new File([blob], 'poster.png', { type: 'image/png' });
                // 分享文件
                await navigator.share({
                    title: props.title || '学习看板',
                    text: props.text || '查看我的学习进度！',
                    url: props.url || window.location.href,
                    files: [file]
                });
            }
            else {
                // 否则分享链接
                await navigator.share({
                    title: props.title || '学习看板',
                    text: props.text || '查看我的学习进度！',
                    url: props.url || window.location.href
                });
            }
            shareSuccess.value = true;
        }
        else {
            // 如果不支持Web Share API，则显示海报生成模态框
            showPosterModal.value = true;
        }
    }
    catch (error) {
        console.error('分享失败:', error);
        shareError.value = true;
    }
    finally {
        isSharing.value = false;
        // 3秒后重置状态
        setTimeout(() => {
            shareSuccess.value = false;
            shareError.value = false;
        }, 3000);
    }
};
// 处理海报生成完成事件
const handlePosterGenerated = (imageUrl) => {
    generatedImageUrl.value = imageUrl;
};
// 显示海报生成模态框并自动生成海报
const showPoster = () => {
    showPosterModal.value = true;
    // 在下一个事件循环中触发自动生成
    setTimeout(() => {
        // 通过事件总线或其他方式触发自动生成
        window.dispatchEvent(new CustomEvent('auto-generate-poster'));
    }, 100);
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['share-button']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-button']} */ ;
/** @type {__VLS_StyleScopedClasses['share-button']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-button']} */ ;
/** @type {__VLS_StyleScopedClasses['share-button']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-button']} */ ;
/** @type {__VLS_StyleScopedClasses['share-container']} */ ;
/** @type {__VLS_StyleScopedClasses['share-button']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-button']} */ ;
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