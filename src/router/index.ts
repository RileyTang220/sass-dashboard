import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../components/layout/DefaultLayout.vue'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/auth/Login.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../pages/auth/Register.vue'),
      meta: { guest: true },
    },
    {
      path: '/invite/:token',
      name: 'AcceptInvite',
      component: () => import('../pages/auth/AcceptInvite.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'Overview', component: () => import('../pages/Overview.vue') },
        { path: 'board', name: 'Board', component: () => import('../pages/Board.vue') },
        { path: 'projects', name: 'Projects', component: () => import('../pages/Projects.vue') },
        { path: 'projects/:id', name: 'Project Detail', component: () => import('../pages/ProjectDetail.vue') },
        { path: 'tasks', name: 'Tasks', component: () => import('../pages/Tasks.vue') },
        { path: 'tasks/:id', name: 'Task Detail', component: () => import('../pages/TaskDetail.vue') },
        { path: 'members', name: 'Members', component: () => import('../pages/Members.vue') },
        { path: 'settings', name: 'Settings', component: () => import('../pages/Settings.vue') },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const guestOnly = to.matched.some((r) => r.meta.guest)

  if (requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  if (guestOnly && authStore.isLoggedIn) {
    next({ path: '/' })
    return
  }
  next()
})

export default router
