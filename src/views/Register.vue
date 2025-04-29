<template>
  <div class="register-container">
    <div class="register-form">
      <h2>注册账号</h2>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="邀请码" prop="invitationCode">
          <el-input
            v-model="form.invitationCode"
            placeholder="请输入邀请码"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleRegister"
            class="register-button"
          >
            注册
          </el-button>
        </el-form-item>

        <div class="login-link">
          已有账号？
          <router-link to="/login">立即登录</router-link>
        </div>
      </el-form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApiService } from '../services/apiService';
import { API_CONFIG } from '../config/apiConfig';

const router = useRouter();
const apiService = useApiService();
const formRef = ref(null);
const loading = ref(false);
const error = ref(null);

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  invitationCode: ''
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.value.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  invitationCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== 'korsonacademy') {
          callback(new Error('邀请码不正确'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

const handleRegister = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;
    error.value = null;

    const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      username: form.value.username,
      email: form.value.email,
      password: form.value.password
    });

    if (response?.data) {
      // 注册成功后直接登录
      const loginResponse = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        username: form.value.username,
        password: form.value.password
      });

      if (loginResponse?.data?.access_token) {
        localStorage.setItem('token', loginResponse.data.access_token);
        router.push('/home');
      }
    }
  } catch (err) {
    console.error('注册失败:', err);
    error.value = err.response?.data?.detail || '注册失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.register-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #409EFF;
  margin-bottom: 2rem;
}

.register-button {
  width: 100%;
  margin-top: 1rem;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
  color: #606266;
}

.login-link a {
  color: #409EFF;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.error-message {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  text-align: center;
}
</style> 