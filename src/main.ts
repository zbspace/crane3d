import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 状态管理
const pinia = createPinia()
app.use(pinia)

// 路由
app.use(router)

// Naive UI
app.use(naive)

app.mount('#app')
