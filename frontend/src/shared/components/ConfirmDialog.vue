<template>
  <div v-if="show" class="confirm-dialog-overlay" @click="onCancel">
    <div class="confirm-dialog" @click.stop>
      <div class="confirm-dialog-header">
        <h3>{{ title }}</h3>
        <button class="close-button" @click="onCancel">&times;</button>
      </div>
      <div class="confirm-dialog-content">
        <p>{{ message }}</p>
      </div>
      <div class="confirm-dialog-actions">
        <button class="cancel-button" @click="onCancel">{{ cancelText }}</button>
        <button class="confirm-button" @click="onConfirm">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// defineProps 和 defineEmits 是编译器宏，不需要导入

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
})

const emit = defineEmits(['confirm', 'cancel'])

const onConfirm = () => {
  emit('confirm')
}

const onCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

.confirm-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #5e72e4, #825ee4);
  color: white;
}

.confirm-dialog-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
  transition: all 0.2s ease;
}

.close-button:hover {
  opacity: 1;
  transform: scale(1.1);
}

.confirm-dialog-content {
  padding: 20px;
  color: #2c3e50;
  font-size: 1rem;
  line-height: 1.5;
}

.confirm-dialog-content p {
  margin: 0;
}

.confirm-dialog-actions {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  gap: 10px;
  border-top: 1px solid #eee;
}

.cancel-button, .confirm-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button {
  background: #f1f2f6;
  color: #7f8c8d;
}

.cancel-button:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.confirm-button {
  background: linear-gradient(135deg, #5e72e4, #825ee4);
  color: white;
  box-shadow: 0 4px 10px rgba(94, 114, 228, 0.3);
}

.confirm-button:hover {
  background: linear-gradient(135deg, #4a5bd4, #6f4dd4);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(94, 114, 228, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
