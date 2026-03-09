<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useDataStore } from '@/stores/dataStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const dataStore = useDataStore()
const subscriptionStore = useSubscriptionStore()
const toast = useToast()

const loading = ref(false)
const form = reactive({
  email: '',
  password: '',
})
const errors = reactive<{ email?: string; password?: string }>({})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): boolean {
  errors.email = undefined
  errors.password = undefined
  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!emailRegex.test(form.email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (!form.password) {
    errors.password = 'Password is required'
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  return !errors.email && !errors.password
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    const ok = await authStore.login(form.email, form.password)
    if (ok) {
      settingsStore.profile = {
        name: authStore.user!.name,
        email: authStore.user!.email,
      }
      await Promise.all([dataStore.initData(), subscriptionStore.init()])
      toast.success('Welcome back!')
      const redirect = (route.query.redirect as string) || '/'
      await router.replace(redirect)
    } else {
      toast.error('Login failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl">
          <span class="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white">S</span>
          SaaSBoard
        </router-link>
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your credentials to access your account.</p>

        <form @submit.prevent="onSubmit" class="space-y-5">
          <div>
            <label for="login-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="block w-full rounded-lg border px-3 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.email }}</p>
          </div>
          <div>
            <label for="login-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="login-password"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="block w-full rounded-lg border px-3 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.password }}</p>
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?
          <router-link to="/register" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Register
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
