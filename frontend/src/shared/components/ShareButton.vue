<script setup lang="ts">
import { ref } from 'vue';

// 组件属性
const props = defineProps<{
  title?: string;
  text?: string;
  url?: string;
}>();

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
    } else {
      // 如果Web Share API不可用，复制链接到剪贴板
      await copyToClipboard();
      shareResult.value = '链接已复制到剪贴板';
    }
    
    // 显示提示
    showTooltip.value = true;
    setTimeout(() => {
      showTooltip.value = false;
    }, 2000);
  } catch (error) {
    console.error('分享失败:', error);
    shareResult.value = '分享失败，请手动复制链接';
    
    // 显示提示
    showTooltip.value = true;
    setTimeout(() => {
      showTooltip.value = false;
    }, 2000);
  } finally {
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
    } else {
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
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
};
</script>

<template>
  <div class="share-button-container">
    <button 
      class="share-button" 
      @click="share" 
      :disabled="isSharing"
      aria-label="分享"
    >
      <span class="share-icon">🔗</span>
      <span class="share-text">分享</span>
    </button>
    
    <div v-if="showTooltip" class="share-tooltip">
      {{ shareResult }}
    </div>
  </div>
</template>

<style scoped>
.share-button-container {
  position: relative;
  display: inline-block;
}

.share-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.share-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.share-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

.share-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.share-icon {
  font-size: 16px;
}

.share-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

.share-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@media (max-width: 480px) {
  .share-text {
    display: none;
  }
  
  .share-button {
    padding: 8px;
  }
}
</style>
