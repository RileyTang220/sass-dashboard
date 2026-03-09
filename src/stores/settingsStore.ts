import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const profile = ref({
    name: 'Admin User',
    email: 'admin@example.com',
  })
  const isMobileSidebarOpen = ref(false)

  // Theme: 'light' | 'dark' | 'system'
  const theme = ref<'light' | 'dark' | 'system'>('system')

  const init = () => {
    const storedProfile = localStorage.getItem('saas_dashboard_profile')
    if (storedProfile) {
      profile.value = JSON.parse(storedProfile)
    }
    const storedTheme = localStorage.getItem('saas_dashboard_theme') as 'light' | 'dark' | 'system' | null
    if (storedTheme) {
      theme.value = storedTheme
    }
    applyTheme()
  }

  const isDark = ref(false)

  const applyTheme = () => {
    const root = document.documentElement
    const dark =
      theme.value === 'dark' ||
      (theme.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    isDark.value = dark
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const setTheme = (t: 'light' | 'dark' | 'system') => {
    theme.value = t
    localStorage.setItem('saas_dashboard_theme', t)
    applyTheme()
  }

  const toggleTheme = () => {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  watch(
    profile,
    (newProfile) => {
      localStorage.setItem('saas_dashboard_profile', JSON.stringify(newProfile))
    },
    { deep: true },
  )

  const toggleMobileSidebar = () => {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  }

  return {
    profile,
    isMobileSidebarOpen,
    theme,
    isDark,
    init,
    toggleMobileSidebar,
    setTheme,
    toggleTheme,
    applyTheme,
  }
})
