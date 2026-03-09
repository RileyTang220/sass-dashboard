<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'

const store = useSettingsStore()

const isDark = ref(false)

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
    isDark.value = true
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences.</p>
    </div>

    <!-- Profile Settings -->
    <div
      class_shadow-sm="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
    >
      <div class="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Edit your personal information.</p>
      </div>
      <form class="p-6 space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Name</label
          >
          <input
            v-model="store.profile.name"
            type="text"
            id="name"
            class="mt-1 block w-full max-w-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          />
        </div>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Email</label
          >
          <input
            v-model="store.profile.email"
            type="email"
            id="email"
            class="mt-1 block w-full max-w-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          />
        </div>
      </form>
    </div>
  </div>
</template>