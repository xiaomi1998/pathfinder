import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@api': resolve(__dirname, 'src/api'),
      '@composables': resolve(__dirname, 'src/composables'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    }
  },
  server: {
    port: 8080,
    host: '0.0.0.0', // 明确指定监听所有接口
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // 使用127.0.0.1确保本地访问
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          d3: ['d3', 'd3-selection', 'd3-scale', 'd3-shape', 'd3-hierarchy', 'd3-zoom', 'd3-drag', 'd3-force'],
          ui: ['@headlessui/vue', '@heroicons/vue']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'd3',
      'd3-selection',
      'd3-scale',
      'd3-shape',
      'd3-hierarchy',
      'd3-zoom',
      'd3-drag',
      'd3-force',
      'lodash-es',
      '@headlessui/vue',
      '@heroicons/vue',
      'axios'
    ]
  }
})