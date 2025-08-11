import type { RouteRecordRaw } from 'vue-router'
import MainView from '@/views/MainView.vue'
import AuthView from '@/views/AuthView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'main',
    component: MainView,
    meta: { requiresAuth: true }
  },
  {
    path: '/auth',
    name: 'auth', 
    component: AuthView
  }
]