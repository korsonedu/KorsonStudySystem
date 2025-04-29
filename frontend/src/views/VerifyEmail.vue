<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { API_CONFIG } from '../config';
import { apiService } from '../services/apiService';

const router = useRouter();
const route = useRoute();

const status = ref<'verifying' | 'success' | 'error'>('verifying');
const message = ref('正在验证您的邮箱...');
const errorDetails = ref('');

// 验证邮箱
const verifyEmail = async (token: string) => {
  try {
    status.value = 'verifying';
    message.value = '正在验证您的邮箱...';
    
    // 调用验证邮箱API
    // 使用POST请求，因为后端验证邮箱的路由是POST方法
    const response = await apiService.post('/api/auth/verify-email', { token });
    
    // 验证成功
    status.value = 'success';
    message.value = '邮箱验证成功！您现在可以登录了。';
    
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/login');
    }, 3000);
    
  } catch (error: any) {
    // 验证失败
    status.value = 'error';
    message.value = '邮箱验证失败';
    errorDetails.value = error.response?.data?.detail || '验证链接无效或已过期，请重新注册或联系管理员。';
    console.error('Email verification error:', error);
  }
};

// 组件挂载时自动验证
onMounted(() => {
  const token = route.query.token as string;
  
  if (!token) {
    status.value = 'error';
    message.value = '验证失败';
    errorDetails.value = '缺少验证令牌，请检查您的验证链接是否完整。';
    return;
  }
  
  verifyEmail(token);
});
</script>

<template>
  <div class="verify-email-container">
    <div class="verify-card">
      <div v-if="status === 'verifying'" class="status-icon verifying">
        <div class="spinner"></div>
      </div>
      <div v-else-if="status === 'success'" class="status-icon success">✓</div>
      <div v-else-if="status === 'error'" class="status-icon error">✗</div>
      
      <h1>{{ message }}</h1>
      
      <p v-if="status === 'success'">
        您的邮箱已成功验证，即将跳转到登录页面...
      </p>
      
      <p v-if="status === 'error'" class="error-details">
        {{ errorDetails }}
      </p>
      
      <div class="actions">
        <router-link v-if="status === 'success'" to="/login" class="btn primary">
          立即登录
        </router-link>
        
        <router-link v-if="status === 'error'" to="/register" class="btn secondary">
          重新注册
        </router-link>
        
        <router-link v-if="status === 'error'" to="/login" class="btn">
          返回登录
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verify-email-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.verify-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.status-icon {
  font-size: 60px;
  margin-bottom: 20px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success {
  color: var(--success-color);
}

.error {
  color: var(--danger-color);
}

.verifying {
  color: var(--primary-color);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

h1 {
  margin-bottom: 20px;
  color: var(--text-color);
}

p {
  margin-bottom: 30px;
  color: var(--text-light);
  line-height: 1.6;
}

.error-details {
  color: var(--danger-color);
  background-color: rgba(231, 76, 60, 0.1);
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: #f1f1f1;
  color: var(--text-color);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn.primary {
  background-color: var(--primary-color);
  color: white;
}

.btn.secondary {
  background-color: var(--secondary-color);
  color: white;
}
</style>
