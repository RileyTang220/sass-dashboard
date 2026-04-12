<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useDataStore } from '@/stores/dataStore'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const dataStore = useDataStore()
const toast = useToast()

const loading = ref(false)
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const errors = reactive<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): boolean {
  errors.name = undefined
  errors.email = undefined
  errors.password = undefined
  errors.confirmPassword = undefined
  if (!form.name.trim()) {
    errors.name = 'Name is required'
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }
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
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  return !errors.name && !errors.email && !errors.password && !errors.confirmPassword
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    const ok = await authStore.register(form.name, form.email, form.password)
    if (ok) {
      settingsStore.profile = {
        name: authStore.user!.name,
        email: authStore.user!.email,
      }
      await dataStore.initData()
      dataStore.syncProfile(authStore.user!.name, authStore.user!.email)
      toast.success('Account created. Welcome!')
      await router.replace('/')
    } else {
      toast.error('Registration failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl">
          <span class="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white">T</span>
          Team Workspace
        </router-link>
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create account</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a shared workspace for your team.</p>

        <form @submit.prevent="onSubmit" class="space-y-5">
          <div>
            <label for="reg-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              id="reg-name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              placeholder="ruiling tang"
              class="block w-full rounded-lg border px-3 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.name }}</p>
          </div>
          <div>
            <label for="reg-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="reg-email"
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
            <label for="reg-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="reg-password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              placeholder="At least 6 characters"
              class="block w-full rounded-lg border px-3 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.password }}</p>
          </div>
          <div>
            <label for="reg-confirm" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm password
            </label>
            <input
              id="reg-confirm"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="block w-full rounded-lg border px-3 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'"
            />
            <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.confirmPassword }}</p>
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {{ loading ? 'Creating account...' : 'Create account' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?
          <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
