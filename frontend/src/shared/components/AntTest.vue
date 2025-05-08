<script setup lang="ts">
import { ref } from 'vue';

const formData = ref({
  username: '',
  password: ''
});

const loading = ref(false);
const visible = ref(false);

const showModal = () => {
  visible.value = true;
};

const handleOk = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    visible.value = false;
  }, 2000);
};

const handleCancel = () => {
  visible.value = false;
};
</script>

<template>
  <div class="ant-test-container">
    <h2>Ant Design Vue 测试</h2>
    
    <a-card title="登录表单" style="width: 400px; margin: 20px auto;">
      <a-form :model="formData" layout="vertical">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formData.username" placeholder="请输入用户名">
            <template #prefix>
              <user-outlined />
            </template>
          </a-input>
        </a-form-item>
        
        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="formData.password" placeholder="请输入密码">
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" block>登录</a-button>
        </a-form-item>
        
        <a-form-item>
          <a-button block>注册</a-button>
        </a-form-item>
      </a-form>
    </a-card>
    
    <div style="margin: 20px; text-align: center;">
      <a-button type="primary" @click="showModal">打开对话框</a-button>
      <a-modal
        v-model:visible="visible"
        title="Ant Design 对话框"
        :confirm-loading="loading"
        @ok="handleOk"
      >
        <p>这是一个 Ant Design Vue 对话框示例</p>
        <p>点击确定按钮会有2秒的加载状态</p>
      </a-modal>
    </div>
    
    <div style="margin: 20px; text-align: center;">
      <a-space>
        <a-button type="primary">主要按钮</a-button>
        <a-button>默认按钮</a-button>
        <a-button type="dashed">虚线按钮</a-button>
        <a-button type="text">文本按钮</a-button>
        <a-button type="link">链接按钮</a-button>
      </a-space>
    </div>
  </div>
</template>

<style scoped>
.ant-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>
