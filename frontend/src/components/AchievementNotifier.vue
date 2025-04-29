<template>
    <transition name="slide-down">
      <div v-if="notification" class="achievement-notification">
        <div class="notification-content">
          <span class="icon">🎉</span>
          <div class="text">
            <h3>成就解锁！</h3>
            <p>{{ notification.title }} Lv.{{ notification.level }}</p>
          </div>
        </div>
      </div>
    </transition>
  </template>
  
  <script>
  export default {
    data: () => ({
      notification: null,
      timeoutId: null
    }),
    mounted() {
      this.$store.subscribe((mutation, state) => {
        if (mutation.type === 'UPDATE_ACHIEVEMENTS') {
          this.checkNewAchievements(mutation.payload, state.achievements)
        }
      })
    },
    methods: {
      checkNewAchievements(newAchievements, oldAchievements) {
        Object.entries(newAchievements).forEach(([key, { level }]) => {
          if (level > (oldAchievements[key]?.level || 0)) {
            this.showNotification({
              title: this.$options.achievementConfig[key].title,
              level
            })
          }
        })
      },
      showNotification(data) {
        this.notification = data
        clearTimeout(this.timeoutId)
        this.timeoutId = setTimeout(() => {
          this.notification = null
        }, 3000)
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .achievement-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    padding: 15px 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 15px;
  
    .icon {
      font-size: 2em;
    }
  
    h3 {
      margin: 0 0 5px;
      color: var(--primary-color);
    }
  
    p {
      margin: 0;
      color: var(--secondary-color);
      font-weight: bold;
    }
  }
  
  .slide-down-enter-active {
    transition: all 0.3s ease-out;
  }
  
  .slide-down-leave-active {
    transition: all 0.3s ease-in;
  }
  
  .slide-down-enter,
  .slide-down-leave-to {
    transform: translateY(-20px);
    opacity: 0;
  }
  </style>