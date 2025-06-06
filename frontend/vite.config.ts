import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import tailwindcss from '@tailwindcss/vite'


// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    // 生产构建配置
    build: {
      // 启用源码映射，便于调试
      sourcemap: mode === 'development',
      // 启用代码分割
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router'],
            'chart-vendor': ['chart.js', 'vue-chartjs'],
            'axios-vendor': ['axios']
          }
        }
      },
      // 压缩选项
      minify: 'terser',
      terserOptions: {
        compress: {
          // 移除console.log
          drop_console: mode === 'production',
          // 保留警告和错误
          drop_debugger: mode === 'production'
        }
      }
    },
    // 开发服务器配置
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'https://plt.korsonedu.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      },
      cors: true
    }
  }
})