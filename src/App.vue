<script setup lang="ts">
import { onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import ToastContainer from '@/components/common/ToastContainer.vue'

const dataStore = useDataStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

onMounted(async () => {
  authStore.init()
  settingsStore.init()
  if (authStore.isLoggedIn && authStore.user) {
    settingsStore.profile = { name: authStore.user.name, email: authStore.user.email }
    dataStore.syncProfile(authStore.user.name, authStore.user.email)
  }
  if (authStore.isLoggedIn) {
    await dataStore.initData()
    if (authStore.user) {
      dataStore.syncProfile(authStore.user.name, authStore.user.email)
    }
  }
})
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
