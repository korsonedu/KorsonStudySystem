<script setup lang="ts">
import { Button } from '../../components/ui/button'

defineProps({
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
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  }
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div v-if="show" class="dialog-portal">
    <!-- Dialog Overlay -->
    <div
      class="dialog-overlay"
      @click="emit('cancel')"
    ></div>

    <!-- Dialog Content -->
    <div
      class="dialog-content"
      @click.stop
    >
      <!-- Dialog Header -->
      <div class="dialog-header">
        <h2 class="dialog-title">{{ title }}</h2>
        <p class="dialog-description">{{ message }}</p>
      </div>

      <!-- Dialog Footer -->
      <div class="dialog-footer">
        <Button
          variant="outline"
          class="dialog-cancel"
          @click="emit('cancel')"
        >
          {{ cancelText }}
        </Button>
        <Button
          class="dialog-confirm"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dialog Portal */
.dialog-portal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 50;
}

/* Dialog Overlay - 苹果风格 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: var(--color-overlay-black);
  backdrop-filter: blur(4px);
  animation: fade-in 200ms ease-out forwards;
}

/* Dialog Content - 苹果风格 */
.dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 50;
  display: grid;
  width: 100%;
  max-width: calc(100% - 2rem);
  transform: translate(-50%, -50%);
  gap: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border-gray);
  background-color: var(--color-card-gray);
  padding: 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  animation: fade-in 200ms ease-out forwards, zoom-in 200ms ease-out forwards;
}

@media (min-width: 640px) {
  .dialog-content {
    max-width: 32rem;
  }
}

/* Dialog Header - 苹果风格 */
.dialog-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}

@media (min-width: 640px) {
  .dialog-header {
    text-align: left;
  }
}

/* Dialog Title - 苹果风格 */
.dialog-title {
  font-size: 1.125rem;
  line-height: 1.3;
  font-weight: 600;
  color: var(--color-text-white);
  margin: 0;
}

/* Dialog Description - 苹果风格 */
.dialog-description {
  font-size: 0.875rem;
  color: var(--color-text-gray);
  margin: 0.5rem 0 0 0;
  line-height: 1.6;
  white-space: pre-line; /* 保留换行符 */
  text-align: left;
  padding: 0.5rem 0;
}

/* Dialog Footer - 苹果风格 */
.dialog-footer {
  display: flex;
  flex-direction: column-reverse;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

@media (min-width: 640px) {
  .dialog-footer {
    flex-direction: row;
    justify-content: flex-end;
  }
}

/* Dialog Buttons - 苹果风格 */
.dialog-cancel {
  background-color: var(--color-input-gray) !important;
  border: none !important;
  color: var(--color-text-white) !important;
  font-weight: 500 !important;
  height: 2.5rem !important;
  min-width: 5rem !important;
  border-radius: 0.375rem !important;
  transition: all 0.2s ease !important;
}

.dialog-confirm {
  background-color: var(--color-accent-orange) !important;
  color: var(--color-text-white) !important;
  border: none !important;
  font-weight: 500 !important;
  height: 2.5rem !important;
  min-width: 5rem !important;
  border-radius: 0.375rem !important;
  transition: all 0.2s ease !important;
}

.dialog-cancel:hover {
  background-color: rgba(57, 57, 61, 0.8) !important;
  filter: brightness(1.1) !important;
}

.dialog-confirm:hover {
  background-color: var(--color-accent-orange-dim) !important;
  filter: brightness(1.1) !important;
}

/* Animation keyframes */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes zoom-in {
  from { transform: translate(-50%, -50%) scale(0.95); }
  to { transform: translate(-50%, -50%) scale(1); }
}

@keyframes zoom-out {
  from { transform: translate(-50%, -50%) scale(1); }
  to { transform: translate(-50%, -50%) scale(0.95); }
}
</style>
