<template>
  <div class="course-home">
    <div class="coming-soon-container">
      <h1>课程系统</h1>
      <div class="coming-soon">
        <div class="icon">🚧</div>
        <h2>即将推出</h2>
        <p>我们正在努力开发课程系统，敬请期待！</p>
        <router-link to="/" class="back-button">返回学习追踪</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 课程系统首页
</script>

<style scoped>
.course-home {
  padding: 20px;
}

.coming-soon-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

h1 {
  color: var(--primary-color);
  margin-bottom: 30px;
}

.coming-soon {
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon {
  font-size: 60px;
  margin-bottom: 20px;
}

h2 {
  font-size: 28px;
  margin-bottom: 15px;
  color: #333;
}

p {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
}

.back-button {
  background: var(--primary-color);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.back-button:hover {
  background: var(--secondary-color);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}
</style>
