<script setup lang="ts">
import { onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useAuthStore } from '@/stores/authStore'
import ToastContainer from '@/components/common/ToastContainer.vue'

const dataStore = useDataStore()
const settingsStore = useSettingsStore()
const subscriptionStore = useSubscriptionStore()
const authStore = useAuthStore()

onMounted(async () => {
  authStore.init()
  if (authStore.isLoggedIn && authStore.user) {
    settingsStore.profile = { name: authStore.user.name, email: authStore.user.email }
  }
  settingsStore.init()
  if (authStore.isLoggedIn) {
    await Promise.all([dataStore.initData(), subscriptionStore.init()])
  }
})
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>