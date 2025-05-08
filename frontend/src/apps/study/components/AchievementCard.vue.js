import { computed } from 'vue';
const props = defineProps();
const emit = defineEmits(['toggle']);
// 切换展开状态
const toggleExpand = (event) => {
    emit('toggle', props.achievement.id, event);
};
// 计算状态文本
const statusText = computed(() => {
    return props.achievement.unlocked ? '已解锁' : '未解锁';
});
// 计算解锁的等级数量
const unlockedLevels = computed(() => {
    return props.achievement.levels.filter(level => level.unlocked).length;
});
// 计算总等级数量
const totalLevels = computed(() => {
    return props.achievement.levels.length;
});
// 计算最高解锁等级
const highestLevel = computed(() => {
    const unlockedLevels = props.achievement.levels.filter(level => level.unlocked);
    return unlockedLevels.length > 0
        ? Math.max(...unlockedLevels.map(level => level.level))
        : 0;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['locked']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-header']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-header']} */ ;
/** @type {__VLS_StyleScopedClasses['highest-level']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['level-number']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['level-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['unlocked']} */ ;
/** @type {__VLS_StyleScopedClasses['level-status']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['locked']} */ ;
/** @type {__VLS_StyleScopedClasses['level-status']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['achievement-card']} */ ;
/** @type {__VLS_StyleScopedClasses['level']} */ ;
/** @type {__VLS_StyleScopedClasses['level-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-content']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['levels-popup']} */ ;
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
//# sourceMappingURL=AchievementCard.vue.js.map