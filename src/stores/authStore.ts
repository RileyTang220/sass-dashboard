import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, getToken } from '@/api/client'

const AUTH_KEY = 'saas_dashboard_auth'

export interface AuthUser {
  email: string
  name: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  const init = () => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as { token: string; user: AuthUser }
      if (data.token && data.user?.email && data.user?.name) {
        token.value = data.token
        user.value = { email: data.user.email, name: data.user.name }
      }
    } catch {
      token.value = null
      user.value = null
    }
  }

  const persist = (t: string, u: AuthUser) => {
    token.value = t
    user.value = u
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: t, user: u }))
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!email.trim() || !password) return false
    try {
      const res = await api.auth.login(email.trim(), password)
      persist(res.token, { email: res.user.email, name: res.user.name })
      return true
    } catch {
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!name.trim() || !email.trim() || !password) return false
    try {
      const res = await api.auth.register(name.trim(), email.trim(), password)
      persist(res.token, { email: res.user.email, name: res.user.name })
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem(AUTH_KEY)
  }

  /** Validate token with server (optional). */
  const validateToken = async (): Promise<boolean> => {
    if (!getToken()) return false
    try {
      const me = await api.auth.me()
      user.value = { email: me.email, name: me.name }
      return true
    } catch {
      logout()
      return false
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    init,
    login,
    register,
    logout,
    validateToken,
  }
})
