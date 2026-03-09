<script setup lang="ts">
import { computed } from 'vue'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useToastStore } from '@/stores/toastStore'
import type { Toast, ToastType } from '@/stores/toastStore'

const toastStore = useToastStore()

const toastConfig: Record<ToastType, { icon: typeof CheckCircleIcon; bgClass: string; iconClass: string }> = {
  success: {
    icon: CheckCircleIcon,
    bgClass: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  error: {
    icon: ExclamationCircleIcon,
    bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    iconClass: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: InformationCircleIcon,
    bgClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
}

const getConfig = (type: ToastType) => toastConfig[type]
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="pointer-events-auto animate-fade-in flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg"
          :class="getConfig(toast.type).bgClass"
        >
          <component
            :is="getConfig(toast.type).icon"
            class="w-5 h-5 flex-shrink-0"
            :class="getConfig(toast.type).iconClass"
          />
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">{{ toast.message }}</p>
          <button
            @click="toastStore.remove(toast.id)"
            class="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-500"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
