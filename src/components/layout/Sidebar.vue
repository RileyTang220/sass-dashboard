<script setup lang="ts">
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { RouterLink, useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'

const navigation = [
  { name: 'Dashboard', to: '/', icon: HomeIcon },
  { name: 'Users', to: '/users', icon: UsersIcon },
  { name: 'Sales Records', to: '/sales', icon: DocumentTextIcon },
  { name: 'Analytics', to: '/analytics', icon: ChartBarIcon },
  { name: 'Billing', to: '/billing', icon: CreditCardIcon },
  { name: 'Settings', to: '/settings', icon: Cog6ToothIcon },
]

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const router = useRouter()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <!-- 
    THIS IS THE FIX:
    Removed 'hidden' and 'md:flex'.
    The DefaultLayout now controls visibility.
  -->
  <aside class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 flex flex-col transition-colors duration-300">
    <!-- Logo Area -->
    <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900 dark:text-white">
        <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
          <ChartBarIcon class="w-5 h-5" />
        </div>
        <span>SaaS<span class="text-indigo-600">Board</span></span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      <RouterLink 
        v-for="item in navigation" 
        :key="item.name" 
        :to="item.to"
        class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
        active-class="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
        :class="[
          $route.path === item.to 
            ? '' 
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
        ]"
      >
        <component 
          :is="item.icon" 
          class="mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200" 
          :class="[$route.path === item.to ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300']"
        />
        {{ item.name }}
      </RouterLink>
    </nav>

    <!-- User Profile + Logout (Bottom Sidebar) -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
      <div class="flex items-center gap-3">
        <img
          class="h-9 w-9 rounded-full bg-gray-300"
          :src="`https://ui-avatars.com/api/?name=${settingsStore.profile.name.replace(' ', '+')}&background=6366f1&color=fff`"
          alt="User Avatar"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{{ settingsStore.profile.name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ settingsStore.profile.email }}</p>
        </div>
      </div>
      <button
        @click="logout"
        class="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
      >
        <ArrowRightOnRectangleIcon class="w-4 h-4" />
        Logout
      </button>
    </div>
  </aside>
</template>