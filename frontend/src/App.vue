<template>
  <div id="app">
    <header>
      <h1>学习工具</h1>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/statistics">统计数据</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>© 2025 学习工具</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style>
/* 全局样式 */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}

header {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
}

header nav a {
  color: white;
  margin-right: 15px;
  text-decoration: none;
}

main {
  padding: 20px;
}

footer {
  text-align: center;
  padding: 10px;
  background-color: #f1f1f1;
}
</style>