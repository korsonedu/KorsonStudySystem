<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiService } from '../services/apiService'
const router = useRouter();
const route = useRoute();
const status = ref('verifying');
const message = ref('正在验证您的邮箱...');
const errorDetails = ref('');
// 验证邮箱
const verifyEmail = async (token) => {
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
    }
    catch (error) {
        // 验证失败
        status.value = 'error';
        message.value = '邮箱验证失败';
        errorDetails.value = error.response?.data?.detail || '验证链接无效或已过期，请重新注册或联系管理员。';
        console.error('Email verification error:', error);
    }
};
// 组件挂载时自动验证
onMounted(() => {
    const token = route.query.token;
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
  <div class="verify-container">
    <div class="verify-card">
      <div v-if="status === 'verifying'" class="verify-status verifying">
        <div class="status-icon">🔄</div>
        <h2>{{ message }}</h2>
        <p>请稍候，正在处理您的请求...</p>
      </div>

      <div v-else-if="status === 'success'" class="verify-status success">
        <div class="status-icon">✅</div>
        <h2>{{ message }}</h2>
        <p>即将跳转到登录页面...</p>
        <button class="btn" @click="router.push('/login')">立即登录</button>
      </div>

      <div v-else class="verify-status error">
        <div class="status-icon">❌</div>
        <h2>{{ message }}</h2>
        <p>{{ errorDetails }}</p>
        <div class="actions">
          <button class="btn" @click="router.push('/register')">重新注册</button>
          <button class="btn" @click="router.push('/login')">返回登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verify-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.verify-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.verify-status {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

h2 {
  margin-bottom: 15px;
  color: #333;
}

p {
  margin-bottom: 25px;
  color: #666;
  line-height: 1.5;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.btn:hover {
  background: var(--secondary-color);
  transform: translateY(-2px);
}

.verifying .status-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success .status-icon {
  color: #2ecc71;
}

.error .status-icon {
  color: #e74c3c;
}
</style>