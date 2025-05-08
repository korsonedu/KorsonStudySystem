<script setup lang="ts">
/**
 * 激励语组件
 * 显示一句激励人心的名言
 */
</script>

<template>
  <div class="motivation-section">
    <div class="quote-container">
      <p class="quote">"教育不是灌输知识，而是点燃思考的火焰。"</p>
      <p class="quote-author">— 苏格拉底</p>
    </div>
  </div>
</template>

<style scoped>
.motivation-section {
  margin: 50px 0;
  text-align: center;
}

.quote-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  background: rgba(33, 150, 243, 0.03);
  border-radius: 16px;
  position: relative;
}

.quote-container::before {
  content: '"';
  position: absolute;
  top: 10px;
  left: 20px;
  font-size: 5rem;
  color: rgba(33, 150, 243, 0.1);
  font-family: Georgia, serif;
  line-height: 1;
}

.quote {
  font-size: 1.5rem;
  color: #1976d2;
  font-weight: 500;
  font-style: italic;
  margin: 0 0 15px;
  line-height: 1.5;
}

.quote-author {
  font-size: 1rem;
  color: #5c6bc0;
  text-align: right;
  margin: 0;
}

/* 响应式布局 */
@media (max-width: 600px) {
  .quote {
    font-size: 1.2rem;
  }
}
</style>
