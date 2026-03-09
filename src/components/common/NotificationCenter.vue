<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  BellIcon,
  CheckIcon,
  UserIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useNotificationStore } from '@/stores/notificationStore'
import type { Notification, NotificationType } from '@/stores/notificationStore'

const router = useRouter()
const notificationStore = useNotificationStore()

const isOpen = ref(false)

const typeIcons: Record<NotificationType, typeof BellIcon> = {
  info: BellIcon,
  success: ShoppingCartIcon,
  warning: ExclamationTriangleIcon,
  system: Cog6ToothIcon,
}

const typeColors: Record<NotificationType, string> = {
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  system: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

const handleClick = (n: Notification) => {
  notificationStore.markAsRead(n.id)
  if (n.link) {
    router.push(n.link)
    isOpen.value = false
  }
}
</script>

<template>
  <Menu v-slot="{ open }" as="div" class="relative">
    <MenuButton
      class="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
    >
      <BellIcon class="w-5 h-5" />
      <span
        v-if="notificationStore.unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white"
      >
        {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
      </span>
    </MenuButton>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems
        class="absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none overflow-hidden z-50"
      >
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <button
            v-if="notificationStore.unreadCount > 0"
            @click="notificationStore.markAllAsRead"
            class="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Mark all as read
          </button>
        </div>
        <div class="max-h-80 overflow-y-auto">
          <div
            v-if="notificationStore.notifications.length === 0"
            class="px-4 py-8 text-center text-sm text-gray-500"
          >
            No notifications
          </div>
          <MenuItem
            v-for="n in notificationStore.notifications"
            :key="n.id"
            v-slot="{ active }"
          >
            <button
              @click="handleClick(n)"
              :class="[
                active ? 'bg-gray-50 dark:bg-gray-800' : '',
                !n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : '',
                'w-full px-4 py-3 text-left flex gap-3 transition-colors',
              ]"
            >
              <div
                :class="[
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  typeColors[n.type],
                ]"
              >
                <component :is="typeIcons[n.type]" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ n.title }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{{ n.message }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ notificationStore.formatTime(n.createdAt) }}</p>
              </div>
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Transition>
  </Menu>
</template>
