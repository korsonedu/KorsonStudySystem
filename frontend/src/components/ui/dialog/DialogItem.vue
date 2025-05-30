<script setup lang="ts">
import { ref } from 'vue';
import { Dialog, DialogContent } from '@/components/ui/dialog';

defineProps<{
  class?: string;
}>();

const open = ref(false);

const handleSelect = (e: Event) => {
  // 阻止事件冒泡，防止下拉菜单关闭
  e.preventDefault();
  e.stopPropagation();
  open.value = true;
};

const handleClose = () => {
  open.value = false;
};
</script>

<template>
  <div>
    <!-- 触发器，通常是一个菜单项 -->
    <div @click="handleSelect" :class="class" style="cursor: pointer; display: flex; align-items: center;">
      <slot name="trigger"></slot>
    </div>

    <!-- 对话框 -->
    <Dialog :open="open" @update:open="handleClose">
      <DialogContent class="dialog-content">
        <slot></slot>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1002;
}
</style>
