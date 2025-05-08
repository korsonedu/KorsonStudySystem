const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: '确认'
    },
    message: {
        type: String,
        default: '确定要执行此操作吗？'
    },
    confirmText: {
        type: String,
        default: '确定'
    },
    cancelText: {
        type: String,
        default: '取消'
    }
});
const emit = defineEmits(['confirm', 'cancel']);
const onConfirm = () => {
    emit('confirm');
};
const onCancel = () => {
    emit('cancel');
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['confirm-dialog-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-button']} */ ;
/** @type {__VLS_StyleScopedClasses['confirm-dialog-content']} */ ;
/** @type {__VLS_StyleScopedClasses['cancel-button']} */ ;
/** @type {__VLS_StyleScopedClasses['cancel-button']} */ ;
/** @type {__VLS_StyleScopedClasses['confirm-button']} */ ;
/** @type {__VLS_StyleScopedClasses['confirm-button']} */ ;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {
        show: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: '确认'
        },
        message: {
            type: String,
            default: '确定要执行此操作吗？'
        },
        confirmText: {
            type: String,
            default: '确定'
        },
        cancelText: {
            type: String,
            default: '取消'
        }
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {
        show: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: '确认'
        },
        message: {
            type: String,
            default: '确定要执行此操作吗？'
        },
        confirmText: {
            type: String,
            default: '确定'
        },
        cancelText: {
            type: String,
            default: '取消'
        }
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=ConfirmDialog.vue.js.map