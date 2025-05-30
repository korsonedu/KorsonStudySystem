<template>
  <div class="avatar-selector">
    <div class="avatar-preview-container">
      <div class="avatar-preview">
        <img :src="previewUrl" alt="Avatar Preview" class="avatar-image" />
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </div>
    
    <div class="avatar-options">
      <!-- 风格选择 -->
      <div class="option-group">
        <h3 class="option-title">风格</h3>
        <div class="option-buttons">
          <button 
            v-for="style in avatarStyles" 
            :key="style.value" 
            @click="updateOption('style', style.value)"
            :class="['style-button', { active: avatarOptions.style === style.value }]"
            :title="style.label"
          >
            {{ style.label }}
          </button>
        </div>
      </div>
      
      <!-- 随机种子 - 对所有风格都显示 -->
      <div class="option-group">
        <h3 class="option-title">随机种子</h3>
        <div class="seed-input">
          <input type="text" v-model="avatarOptions.seed" class="seed-field" @input="updatePreview" />
          <button @click="generateRandomSeed" class="style-button">随机</button>
        </div>
      </div>
      
      <!-- 背景色选项 -->
      <div class="option-group" v-if="hasColorOptions">
        <h3 class="option-title">背景色</h3>
        <div class="color-options">
          <button
            v-for="(color, index) in backgroundColorOptions"
            :key="index"
            @click="updateOption('backgroundColor', color)"
            :class="['color-button', { active: avatarOptions.backgroundColor === color }]"
            :style="{ backgroundColor: color }"
          ></button>
        </div>
      </div>
      
      <!-- 随机生成按钮 -->
      <div class="random-avatar-container">
        <button @click="generateRandomAvatar" class="random-button">
          🎲 随机生成头像
        </button>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="avatar-actions">
      <button @click="saveAvatar" class="action-button save-button" :disabled="isLoading">{{ isLoading ? '保存中...' : '保存' }}</button>
      <button @click="$emit('cancel')" class="action-button cancel-button" :disabled="isLoading">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { STORAGE_CONFIG } from '@/config'
import { apiService } from '@/shared/services/apiService'

const emit = defineEmits(['save', 'cancel'])
const userStore = useUserStore()
const router = useRouter()

// 跟踪加载状态
const isLoading = ref(false)

// 可用的头像风格 - 更新DiceBear可用风格的最新列表
const avatarStyles = [
  { label: '像素', value: 'pixel-art' },
  { label: '卡通', value: 'lorelei' },
  { label: '简约', value: 'micah' },
  { label: '圆形', value: 'bottts' },
  { label: '方块', value: 'identicon' },
  { label: '几何', value: 'shapes' },
  { label: '人物', value: 'avataaars' },
  { label: '动漫', value: 'adventurer' },
  { label: '迷你', value: 'miniavs' },
  { label: 'Notion风', value: 'notionists' },
  { label: '开放人物', value: 'open-peeps' },
  { label: '角色', value: 'personas' },
  { label: '初始', value: 'initials' },
  { label: '涂鸦', value: 'croodles' }
]

// 背景颜色选项
const backgroundColorOptions = [
  '#f5f5f7', '#ffffff', '#e0e0e0', '#2196f3', '#0071e3', 
  '#4caf50', '#f44336', '#ff9800', '#9c27b0', '#212121'
]

// 头像选项
const avatarOptions = reactive({
  style: 'pixel-art',
  seed: '',
  backgroundColor: '#f5f5f7'
})

// 预览URL - 使用缓存避免频繁请求
const previewUrl = ref('')
const previewCache = new Map()

// 判断当前风格是否支持背景色选项
const hasColorOptions = computed(() => {
  return ['pixel-art', 'identicon', 'shapes', 'micah', 'initials', 'thumbs', 'avataaars', 'lorelei', 'adventurer', 'miniavs'].includes(avatarOptions.style)
})

// 生成随机种子
const generateRandomSeed = () => {
  avatarOptions.seed = Math.random().toString(36).substring(2, 10)
  updatePreview()
}

// 生成完全随机的头像
const generateRandomAvatar = () => {
  // 随机选择一个风格
  const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
  avatarOptions.style = randomStyle.value;
  
  // 生成新的随机种子
  avatarOptions.seed = Math.random().toString(36).substring(2, 10);
  
  // 如果支持背景色，随机选择一个
  if (hasColorOptions.value) {
    avatarOptions.backgroundColor = backgroundColorOptions[Math.floor(Math.random() * backgroundColorOptions.length)];
  }
  
  // 更新预览
  updatePreview();
}

// 更新选项
const updateOption = (optionName: string, value: string) => {
  // 更新选项
  avatarOptions[optionName as keyof typeof avatarOptions] = value;
  
  // 更新预览
  updatePreview();
};

// 创建一个节流函数来限制请求频率
const throttle = (fn: Function, delay: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;
  
  return function(this: any, ...args: any[]) {
    const now = Date.now();
    const remaining = delay - (now - lastExecTime);
    
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastExecTime = now;
      fn.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastExecTime = Date.now();
        timeout = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
};

// 通过后端API获取头像URL
const fetchAvatarFromBackend = async (options: any) => {
  try {
    isLoading.value = true;
    
    // 创建URL参数对象
    const params = new URLSearchParams();
    
    // 为后端API添加所有必要参数
    params.append('style', options.style);
    params.append('seed', options.seed);
    
    if (options.backgroundColor) {
      params.append('backgroundColor', options.backgroundColor.replace('#', ''));
    }
    
    // 对于initials风格，添加字符参数
    if (options.style === 'initials' && userStore.username) {
      params.append('chars', userStore.username.charAt(0).toUpperCase());
    }
    
    // 使用后端代理API获取头像
    const response = await apiService.get(`/api/avatar/generate?${params.toString()}`);
    
    // 如果后端返回了base64图像或URL
    if (response.data && response.data.avatar) {
      return response.data.avatar;
    } else {
      throw new Error('后端没有返回有效的头像数据');
    }
  } catch (error) {
    console.error('通过后端获取头像失败:', error);
    // 返回一个应急的URL
    return generateFallbackAvatarUrl(options);
  } finally {
    isLoading.value = false;
  }
};

// 生成后备的头像URL（直接使用DiceBear，但仅作为应急方案）
const generateFallbackAvatarUrl = (options: any) => {
  try {
    const params = new URLSearchParams();
    
    if (options.backgroundColor) {
      params.append('backgroundColor', options.backgroundColor.replace('#', ''));
    }
    
    if (options.seed) {
      params.append('seed', options.seed);
    }
    
    if (options.style === 'initials' && userStore.username) {
      params.append('chars', userStore.username.charAt(0).toUpperCase());
    }
    
    return `https://api.dicebear.com/7.x/${options.style}/svg?${params.toString()}`;
  } catch (e) {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=fallback`;
  }
};

// 生成缓存键
const generateCacheKey = (options: any) => {
  return `${options.style}-${options.seed}-${options.backgroundColor}`;
};

// 更新预览URL - 使用节流函数避免频繁请求
const updatePreviewThrottled = throttle(async () => {
  try {
    // 生成缓存键
    const cacheKey = generateCacheKey(avatarOptions);
    
    // 检查缓存中是否已有此头像
    if (previewCache.has(cacheKey)) {
      console.log('从缓存获取头像');
      previewUrl.value = previewCache.get(cacheKey);
      return;
    }
    
    console.log('获取新头像');
    isLoading.value = true;
    
    // 尝试从后端获取头像
    // 注意：这里假设后端已经实现了头像生成API，如果没有，将使用fallback方法
    try {
      // 检查后端API是否可用
      const avatarUrl = await fetchAvatarFromBackend(avatarOptions);
      previewUrl.value = avatarUrl;
      
      // 保存到缓存
      previewCache.set(cacheKey, avatarUrl);
    } catch (error) {
      console.error('获取头像失败，使用fallback方法:', error);
      // 使用fallback方法
      const fallbackUrl = generateFallbackAvatarUrl(avatarOptions);
      previewUrl.value = fallbackUrl;
      
      // 保存到缓存
      previewCache.set(cacheKey, fallbackUrl);
    }
  } catch (error) {
    console.error('生成头像预览失败:', error);
    previewUrl.value = generateFallbackAvatarUrl({
      style: 'identicon',
      seed: 'fallback'
    });
  } finally {
    isLoading.value = false;
  }
}, 300); // 300ms节流时间

// 暴露给模板的更新预览方法
const updatePreview = () => {
  updatePreviewThrottled();
};

// 保存头像
const saveAvatar = async () => {
  try {
    console.log('保存头像: 准备发送请求');
    isLoading.value = true;
    
    // 准备要发送到服务器的数据 - 只发送头像URL
    const avatarData = {
      avatar: previewUrl.value
    }
    
    console.log('发送头像数据:', avatarData)
    
    // 使用apiService发送请求
    const response = await apiService.put('/api/users/me/avatar', avatarData)
    
    console.log('保存头像成功:', response.data)
    
    // 更新用户头像状态
    userStore.setAvatar(response.data.avatar)
    
    // 确保本地存储也被更新 - 这是关键步骤，确保刷新后头像不会消失
    localStorage.setItem('user_avatar', response.data.avatar);
    // 保存头像选项到localStorage，以便后续使用
    localStorage.setItem('user_avatar_options', JSON.stringify(avatarOptions));
    
    // 显示成功通知
    toast.success('头像已更新', {
      description: '您的新头像已保存',
      position: 'top-right'
    })
    
    // 触发保存事件
    emit('save', response.data.avatar)
  } catch (error: any) {
    console.error('保存头像失败:', error)
    
    let errorMsg = '未知错误'
    if (error.response?.status === 401) {
      errorMsg = '认证失败，请重新登录'
      // 清除登录状态，强制用户重新登录
      localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY)
      router.push('/login')
    } else if (error.response?.data?.detail) {
      errorMsg = error.response.data.detail
    } else if (error.message) {
      errorMsg = error.message
    }
    
    toast.error('保存头像失败', {
      description: errorMsg,
      position: 'top-right'
    })
  } finally {
    isLoading.value = false;
  }
}

// 组件挂载时初始化
onMounted(async () => {
  // 尝试从localStorage获取现有的头像选项
  const savedOptions = localStorage.getItem('user_avatar_options');
  if (savedOptions) {
    try {
      const storedOptions = JSON.parse(savedOptions);
      Object.assign(avatarOptions, storedOptions);
      console.log('从本地存储恢复头像选项:', avatarOptions);
    } catch (e) {
      console.error('解析存储的头像选项失败:', e);
      // 如果解析失败，设置随机种子
      generateRandomSeed();
    }
  } else {
    // 如果没有现有选项，设置随机种子
    generateRandomSeed();
  }
  
  // 更新预览
  await updatePreview();
})
</script>

<style scoped>
.avatar-selector {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 16px;
  background-color: #fff;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
}

.avatar-preview-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 60px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 4px solid white;
  background-color: #f5f5f7;
  transition: transform 0.3s ease;
}

.avatar-preview:hover {
  transform: scale(1.05);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 加载中的覆盖层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 加载动画 */
.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0071e3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.avatar-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.option-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-button {
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  background-color: #f5f5f7;
  color: #1d1d1f;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.style-button.active {
  background-color: #0071e3;
  color: white;
  border-color: #0071e3;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.3);
}

.style-button:hover:not(.active) {
  background-color: #e5e5ea;
  transform: translateY(-2px);
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-button {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: 2px solid #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-button.active {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid #0071e3;
}

.color-button:hover:not(.active) {
  transform: scale(1.15);
}

.seed-input {
  display: flex;
  gap: 8px;
}

.seed-field {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  background-color: #f5f5f7;
  transition: all 0.2s ease;
}

.seed-field:focus {
  border-color: #0071e3;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.2);
}

.random-avatar-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.random-button {
  padding: 12px 24px;
  border-radius: 24px;
  background-color: #0071e3;
  color: white;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 300px;
}

.random-button:hover {
  background-color: #0077ed;
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 113, 227, 0.3);
}

.random-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(0, 113, 227, 0.2);
}

.avatar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.action-button {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-button {
  background-color: #0071e3;
  color: white;
  border: none;
}

.save-button:hover:not(:disabled) {
  background-color: #0077ed;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 113, 227, 0.3);
}

.cancel-button {
  background-color: transparent;
  color: #1d1d1f;
  border: 1px solid #e0e0e0;
}

.cancel-button:hover:not(:disabled) {
  background-color: #f5f5f7;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .avatar-selector {
    padding: 15px;
  }
}
</style> 