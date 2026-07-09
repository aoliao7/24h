import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/canvas',
      name: 'canvas',
      component: () => import('../views/CanvasView.vue'),
    },
    {
      path: '/canvas/share/:token',
      name: 'canvas-share',
      component: () => import('../views/CanvasView.vue'),
    },
    {
      path: '/templates',
      name: 'templates',
      component: () => import('../views/TemplatesView.vue'),
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('../views/GalleryView.vue'),
    },
    {
      path: '/credits',
      name: 'credits',
      component: () => import('../views/CreditsView.vue'),
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('../views/TeamView.vue'),
    },
    {
      path: '/ad-platforms',
      name: 'ad-platforms',
      component: () => import('../views/AdPlatformView.vue'),
    },
    {
      path: '/workflows/:id/permissions',
      name: 'workflow-permissions',
      component: () => import('../views/WorkflowPermissionsView.vue'),
    },
  ],
})

export default router
