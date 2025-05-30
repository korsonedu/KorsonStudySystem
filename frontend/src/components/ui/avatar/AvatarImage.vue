<script setup lang="ts">
import type { AvatarImageProps } from 'reka-ui'
import { AvatarImage } from 'reka-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'

const props = defineProps<AvatarImageProps>()
const userStore = useUserStore()

// 本地状态，用于处理头像加载失败的情况
const avatarLoadError = ref(false)
const finalSrc = ref('')

// 确保 src 属性是有效的 URL
const imageSrc = computed(() => {
  // 如果加载失败，尝试从localStorage获取
  if (avatarLoadError.value) {
    console.log('AvatarImage: 头像加载失败，尝试使用备选方案')
    const localAvatar = localStorage.getItem('user_avatar')
    if (localAvatar) {
      console.log('AvatarImage: 使用本地存储的头像')
      return localAvatar
    }

    // 如果本地存储也没有，使用用户名首字母作为fallback
    if (userStore.username) {
      console.log('AvatarImage: 使用用户名首字母作为头像')
      return `https://api.dicebear.com/7.x/initials/svg?chars=${userStore.username.charAt(0).toUpperCase()}`
    }

    // 最后的fallback
    console.log('AvatarImage: 使用默认头像')
    return `https://api.dicebear.com/7.x/identicon/svg?seed=fallback`
  }

  if (!props.src) {
    console.log('AvatarImage: 没有提供src属性')
    // 尝试从用户状态获取
    if (userStore.currentUser?.avatar) {
      console.log('AvatarImage: 使用用户状态中的头像')
      return userStore.currentUser.avatar
    }

    // 尝试从localStorage获取
    const localAvatar = localStorage.getItem('user_avatar')
    if (localAvatar) {
      console.log('AvatarImage: 使用本地存储的头像')
      return localAvatar
    }

    // 如果都没有，使用默认头像
    if (userStore.username) {
      console.log('AvatarImage: 使用用户名首字母作为头像')
      return `https://api.dicebear.com/7.x/initials/svg?chars=${userStore.username.charAt(0).toUpperCase()}`
    }

    return ''
  }

  // 如果是 data URL 或 DiceBear URL，直接返回
  if (props.src.startsWith('data:') || props.src.includes('dicebear.com')) {
    return props.src
  }

  // 如果是相对路径，添加基础 URL
  if (props.src.startsWith('/')) {
    return `${import.meta.env.VITE_API_BASE_URL}${props.src}`
  }

  return props.src
})

// 处理图像加载错误
const handleError = () => {
  console.error('AvatarImage: 头像加载失败:', props.src)
  avatarLoadError.value = true

  // 尝试从localStorage获取
  const localAvatar = localStorage.getItem('user_avatar')
  if (localAvatar && localAvatar !== props.src) {
    console.log('AvatarImage: 使用本地存储的头像')
    finalSrc.value = localAvatar

    // 如果本地存储的头像与当前加载失败的不同，尝试更新到后端
    if (userStore.isLoggedIn && props.src && props.src !== localAvatar) {
      console.log('AvatarImage: 尝试将本地头像同步到后端')
      userStore.setAvatar(localAvatar).catch(e => {
        console.error('AvatarImage: 同步头像到后端失败:', e)
      })
    }
  } else if (userStore.currentUser?.avatar && userStore.currentUser.avatar !== props.src) {
    // 尝试从用户状态获取
    console.log('AvatarImage: 使用用户状态中的头像')
    finalSrc.value = userStore.currentUser.avatar
  } else {
    // 使用默认头像
    console.log('AvatarImage: 使用默认头像')
    const username = userStore.username || 'U'
    finalSrc.value = `https://api.dicebear.com/7.x/initials/svg?chars=${username.charAt(0).toUpperCase()}`

    // 保存到本地存储，以便下次使用
    localStorage.setItem('user_avatar', finalSrc.value)
  }
}

// 组件挂载时设置初始src
onMounted(() => {
  finalSrc.value = imageSrc.value
})

// 监听imageSrc变化
watch(imageSrc, (newSrc) => {
  finalSrc.value = newSrc
})
</script>

<template>
  <AvatarImage
    data-slot="avatar-image"
    :src="finalSrc || imageSrc"
    @error="handleError"
    class="aspect-square size-full"
  >
    <slot />
  </AvatarImage>
</template>
