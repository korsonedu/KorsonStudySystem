import { computed, watch } from 'vue';
const props = defineProps();
const emit = defineEmits();
// 计算属性
const progress = computed(() => {
    // 假设默认总时间是25分钟
    const defaultTotal = 25 * 60;
    const total = props.totalSeconds > 0 ? props.totalSeconds : defaultTotal;
    return (1 - props.totalSeconds / total) * 100;
});
// 格式化时间
const formattedTime = computed(() => {
    const minutes = Math.floor(props.totalSeconds / 60);
    const seconds = props.totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});
// 计算圆环路径
const radius = 90; // 圆的半径
const circumference = 2 * Math.PI * radius;
// 计算圆环描边长度
const strokeDashoffset = computed(() => {
    return circumference - (progress.value / 100) * circumference;
});
// 监听时间变化
watch(() => props.totalSeconds, (newValue) => {
    if (newValue <= 0 && props.isRunning) {
        emit('timeUp');
    }
});
// 计算颜色
const timerColor = computed(() => {
    // 根据剩余时间变化颜色
    const ratio = props.totalSeconds / (25 * 60); // 假设默认是25分钟
    if (ratio > 0.6)
        return '#4CAF50'; // 绿色
    if (ratio > 0.3)
        return '#FFC107'; // 黄色
    return '#F44336'; // 红色
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['circular-timer']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-text']} */ ;
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