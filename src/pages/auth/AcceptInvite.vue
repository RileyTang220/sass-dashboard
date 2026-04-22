<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api/client'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const token = route.params.token as string
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const inviteInfo = ref<{ email: string; workspaceName: string; role: string } | null>(null)

const form = reactive({
  name: '',
  password: '',
  confirmPassword: '',
})

onMounted(async () => {
  try {
    inviteInfo.value = await api.members.getInviteInfo(token)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Invalid or expired invite link'
  } finally {
    loading.value = false
  }
})

async function onSubmit() {
  if (!form.name.trim()) {
    toast.error('Please enter your name')
    return
  }
  if (form.password.length < 6) {
    toast.error('Password must be at least 6 characters')
    return
  }
  if (form.password !== form.confirmPassword) {
    toast.error('Passwords do not match')
    return
  }

  submitting.value = true
  try {
    await api.members.acceptInvite(token, {
      name: form.name.trim(),
      password: form.password,
    })
    toast.success('Account created! You can now sign in.')
    router.push('/login')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Failed to accept invite')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl">
          <span class="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white">T</span>
          Team Workspace
        </router-link>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-8">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">Verifying invite...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-8">
          <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
          <router-link to="/login" class="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Go to login
          </router-link>
        </div>

        <!-- Accept invite form -->
        <template v-else-if="inviteInfo">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join Workspace</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
            You've been invited to join <span class="font-medium text-gray-700 dark:text-gray-200">{{ inviteInfo.workspaceName }}</span> as <span class="font-medium text-gray-700 dark:text-gray-200">{{ inviteInfo.role }}</span>.
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-6">{{ inviteInfo.email }}</p>

          <form @submit.prevent="onSubmit" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Enter your name"
                class="block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                v-model="form.password"
                type="password"
                required
                placeholder="Create a password"
                class="block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
              <input
                v-model="form.confirmPassword"
                type="password"
                required
                placeholder="Confirm your password"
                class="block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              :disabled="submitting"
              class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {{ submitting ? 'Creating account...' : 'Accept Invite & Create Account' }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?
            <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign in
            </router-link>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
