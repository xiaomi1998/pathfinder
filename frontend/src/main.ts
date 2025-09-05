import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/main.css'

// Import global components
import LoadingSpinner from '@components/common/LoadingSpinner.vue'
import ErrorAlert from '@components/common/ErrorAlert.vue'
import SuccessAlert from '@components/common/SuccessAlert.vue'

// Create Vue app instance
const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)

// Register global components
app.component('LoadingSpinner', LoadingSpinner)
app.component('ErrorAlert', ErrorAlert)
app.component('SuccessAlert', SuccessAlert)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component:', instance)
  console.error('Error info:', info)
}

// Performance tracking
if (import.meta.env.DEV) {
  app.config.performance = true
}

// Mount the app
app.mount('#app')