<template>
  <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav>
  <router-view/>
  <div id="app">
    <router-view/>
    <achievement-notifier />
    <export-button v-if="$route.path === '/'" />
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>

<script>
import AchievementNotifier from '@/components/AchievementNotifier.vue'
import ExportButton from '@/components/ExportButton.vue'

export default {
  components: {
    AchievementNotifier,
    ExportButton
  }
}
</script>