import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../components/layout/DefaultLayout.vue'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/authlogin.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../pages/authregister.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'Dashboard', component: () => import('../pages/Dashboard.vue') },
        { path: 'users', name: 'Users', component: () => import('../pages/Users.vue') },
        { path: 'sales', name: 'Sales', component: () => import('../pages/Sales.vue') },
        { path: 'analytics', name: 'Analytics', component: () => import('../pages/Analytics.vue') },
        { path: 'settings', name: 'Settings', component: () => import('../pages/Settings.vue') },
        { path: 'billing', name: 'Billing', component: () => import('../pages/Billing.vue') },
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