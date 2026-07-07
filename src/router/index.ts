import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'crane',
    component: () => import('@/views/CranePage.vue')
  },
  {
    path: '/glb-viewer',
    name: 'glbViewer',
    component: () => import('@/views/GlbViewer.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
