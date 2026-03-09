import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  const persist = () => {
    if (token.value && user.value) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token: token.value, user: user.value }))
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  }

  const login = (email: string, password: string): boolean => {
    if (!email.trim() || !password) return false
    const normalizedEmail = email.trim().toLowerCase()
    const namePart = normalizedEmail.split('@')[0]
    const name = (namePart ?? '').replace(/[._]/g, ' ').trim() || 'User'
    token.value = 'mock-jwt-' + Math.random().toString(36).slice(2)
    user.value = { email: normalizedEmail, name }
    persist()
    return true
  }

  const register = (name: string, email: string, password: string): boolean => {
    if (!name.trim() || !email.trim() || !password) return false
    const normalizedEmail = email.trim().toLowerCase()
    token.value = 'mock-jwt-' + Math.random().toString(36).slice(2)
    user.value = { email: normalizedEmail, name: name.trim() }
    persist()
    return true
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem(AUTH_KEY)
  }

  return {
    token,
    user,
    isLoggedIn,
    init,
    login,
    register,
    logout,
  }
})
