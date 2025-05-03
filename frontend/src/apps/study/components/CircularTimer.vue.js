import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
const props = defineProps();
const emit = defineEmits(['timeUp']);
// 简单状态变量
const remainingSeconds = ref(props.totalSeconds);
let timerId = null;
// 格式化时间显示
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
// 清除计时器
function clearTimer() {
    if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
    }
}
// 启动计时器
function startTimer() {
    // 清除现有计时器
    clearTimer();
    // 记录开始时间和初始总秒数
    const startTime = Date.now();
    const initialSeconds = props.totalSeconds;
    // 创建新计时器
    timerId = window.setInterval(() => {
        // 如果不在运行状态，清除计时器
        if (!props.isRunning) {
            clearTimer();
            return;
        }
        // 计算剩余时间
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const newRemaining = Math.max(initialSeconds - elapsedSeconds, 0);
        // 更新剩余时间
        remainingSeconds.value = newRemaining;
        // 如果时间到了，触发完成事件
        if (newRemaining <= 0) {
            clearTimer();
            emit('timeUp');
        }
    }, 500);
}
// 监听totalSeconds变化
watch(() => props.totalSeconds, (newValue) => {
    remainingSeconds.value = newValue;
    // 如果正在运行，重新启动计时器
    if (props.isRunning) {
        startTimer();
    }
});
// 监听isRunning变化
watch(() => props.isRunning, (isRunning) => {
    if (isRunning) {
        startTimer();
    }
    else {
        clearTimer();
    }
});
// 组件挂载时启动计时器
onMounted(() => {
    if (props.isRunning) {
        startTimer();
    }
});
// 组件卸载时清除计时器
onBeforeUnmount(clearTimer);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['timer-status']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-decoration']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-decoration']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['running']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['running']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-decoration']} */ ;
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
//# sourceMappingURL=CircularTimer.vue.js.map