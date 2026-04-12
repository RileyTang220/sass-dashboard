<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsStore'
import { useDataStore } from '@/stores/dataStore'

const store = useSettingsStore()
const dataStore = useDataStore()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Manage your workspace identity, account profile, and appearance preferences.</p>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
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

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <div class="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Workspace</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Current workspace details used across the dashboard.</p>
      </div>
      <div class="grid gap-4 p-6 md:grid-cols-3">
        <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</p>
          <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{{ dataStore.workspace?.name ?? 'Workspace' }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Slug</p>
          <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{{ dataStore.workspace?.slug ?? 'workspace' }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Plan</p>
          <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{{ dataStore.workspace?.plan ?? 'Team' }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <div class="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Choose how the dashboard looks.</p>
      </div>
      <div class="p-6">
        <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            @click="store.setTheme('light')"
            :class="[
              store.theme === 'light'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
              'px-4 py-2 text-sm font-medium transition-colors',
            ]"
          >
            Light
          </button>
          <button
            type="button"
            @click="store.setTheme('dark')"
            :class="[
              store.theme === 'dark'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
              'px-4 py-2 text-sm font-medium transition-colors border-x border-gray-200 dark:border-gray-700',
            ]"
          >
            Dark
          </button>
          <button
            type="button"
            @click="store.setTheme('system')"
            :class="[
              store.theme === 'system'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
              'px-4 py-2 text-sm font-medium transition-colors',
            ]"
          >
            System
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
