<script setup lang="ts">
import { ref } from 'vue'
import SimplePoster from './SimplePoster.vue'
// Teleport 是 Vue 3 内置组件，不需要显式导入

const props = defineProps<{
  title?: string
  text?: string
  url?: string
}>()

const isSharing = ref(false)
const shareSuccess = ref(false)
const shareError = ref(false)
const showPosterModal = ref(false)
const generatedImageUrl = ref('')

// 分享功能
const share = async () => {
  isSharing.value = true
  shareSuccess.value = false
  shareError.value = false

  try {
    // 检查浏览器是否支持Web Share API
    if (navigator.share) {
      // 如果有生成的海报图片，则分享图片
      if (generatedImageUrl.value) {
        // 创建一个Blob对象
        const response = await fetch(generatedImageUrl.value)
        const blob = await response.blob()

        // 创建一个File对象
        const file = new File([blob], 'poster.png', { type: 'image/png' })

        // 分享文件
        await navigator.share({
          title: props.title || '学习看板',
          text: props.text || '查看我的学习进度！',
          url: props.url || window.location.href,
          files: [file]
        })
      } else {
        // 否则分享链接
        await navigator.share({
          title: props.title || '学习看板',
          text: props.text || '查看我的学习进度！',
          url: props.url || window.location.href
        })
      }
      shareSuccess.value = true
    } else {
      // 如果不支持Web Share API，则显示海报生成模态框
      showPosterModal.value = true
    }
  } catch (error) {
    console.error('分享失败:', error)
    shareError.value = true
  } finally {
    isSharing.value = false

    // 3秒后重置状态
    setTimeout(() => {
      shareSuccess.value = false
      shareError.value = false
    }, 3000)
  }
}

// 处理海报生成完成事件
const handlePosterGenerated = (imageUrl: string) => {
  generatedImageUrl.value = imageUrl
}

// 显示海报生成模态框并自动生成海报
const showPoster = () => {
  showPosterModal.value = true
  // 在下一个事件循环中触发自动生成
  setTimeout(() => {
    // 通过事件总线或其他方式触发自动生成
    window.dispatchEvent(new CustomEvent('auto-generate-poster'))
  }, 100)
}
</script>

<template>
  <div class="share-container">
    <button
      class="share-button"
      @click="share"
      :disabled="isSharing"
    >
      <span v-if="isSharing">分享中...</span>
      <span v-else-if="shareSuccess">分享成功！</span>
      <span v-else-if="shareError">分享失败</span>
      <span v-else>📤 分享</span>
    </button>

    <button
      class="poster-button"
      @click="showPoster"
      :disabled="isSharing"
    >
      🖼️ 下载海报
    </button>

    <!-- 使用v-if而不是v-show来避免闪烁问题 -->
    <Teleport to="body">
      <SimplePoster
        v-if="showPosterModal"
        :showModal="true"
        @close="showPosterModal = false"
        @generated="handlePosterGenerated"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.share-container {
  display: flex;
  gap: 10px;
}

.share-button, .poster-button {
  background: rgba(52, 152, 219, 0.05);
  color: var(--text-color);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  font-size: 1rem;
}

.share-button:hover:not(:disabled),
.poster-button:hover:not(:disabled) {
  background: rgba(52, 152, 219, 0.15);
  transform: translateY(-2px);
}

.share-button:active:not(:disabled),
.poster-button:active:not(:disabled) {
  transform: translateY(0);
}

.share-button:disabled,
.poster-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .share-container {
    flex-direction: column;
  }

  .share-button, .poster-button {
    width: 100%;
  }
}
</style>
