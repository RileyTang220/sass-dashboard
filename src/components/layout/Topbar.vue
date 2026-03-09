<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { SunIcon, MoonIcon, Bars3Icon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'
import NotificationCenter from '@/components/common/NotificationCenter.vue'
import GlobalSearch from '@/components/common/GlobalSearch.vue'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()
const isSearchOpen = ref(false)

onMounted(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (settingsStore.theme === 'system') settingsStore.applyTheme()
  })
})
</script>

<template>
  <header
    class="sticky top-0 z-20 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors duration-300"
  >
    <!-- Left: Mobile Menu Trigger & Page Title -->
    <div class="flex items-center gap-4">
      <button
        @click="settingsStore.toggleMobileSidebar"
        class="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <Bars3Icon class="w-6 h-6" />
      </button>
      <h1 class="text-lg font-semibold text-gray-900 dark:text-white capitalize">
        {{ $route.name?.toString().replace('-', ' ') }}
      </h1>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2 sm:gap-4">
      <button
        @click="isSearchOpen = true"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
      >
        <MagnifyingGlassIcon class="w-4 h-4" />
        <span class="hidden sm:inline">Search...</span>
        <kbd class="hidden md:inline-flex px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono">⌘K</kbd>
      </button>

      <button
        @click="settingsStore.toggleTheme"
        class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        :title="settingsStore.isDark ? 'Switch to light' : 'Switch to dark'"
      >
        <SunIcon v-if="settingsStore.isDark" class="w-5 h-5" />
        <MoonIcon v-else class="w-5 h-5" />
      </button>

      <NotificationCenter />

      <DateRangeFilter />
    </div>

    <GlobalSearch v-model="isSearchOpen" />
  </header>
</template>