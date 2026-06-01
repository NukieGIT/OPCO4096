import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/emulation',
      name: 'emulation',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/EmulationView.vue'),
    },
    {
      path: '/enhanced-emulation',
      name: 'enhanced-emulation',
      alias: '/ee',
      component: () => import('../views/EnhancedEmulationView.vue'),
    },
    {
      path: '/emulation2',
      name: 'emulation2',
      alias: '/e2',
      component: () => import('../views/EmulationView2.vue'),
    },
  ],
})

export default router
