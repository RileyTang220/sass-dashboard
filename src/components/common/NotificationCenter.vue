<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  BellIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  BoltIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useNotificationStore } from '@/stores/notificationStore'
import type { Notification, NotificationType } from '@/types'

const router = useRouter()
const store = useNotificationStore()

const typeIcons: Record<NotificationType, typeof BellIcon> = {
  TaskAssigned: UserPlusIcon,
  TaskStatusChanged: ArrowPathIcon,
  TaskCommented: ChatBubbleLeftIcon,
  SprintStarted: BoltIcon,
  SprintCompleted: CheckCircleIcon,
  MemberAdded: UserPlusIcon,
  MemberRemoved: UserPlusIcon,
}

const typeColors: Record<NotificationType, string> = {
  TaskAssigned: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  TaskStatusChanged: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  TaskCommented: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  SprintStarted: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  SprintCompleted: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  MemberAdded: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  MemberRemoved: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

const handleClick = (n: Notification) => {
  store.markAsRead(n.id)
  if (n.linkUrl) {
    router.push(n.linkUrl)
  }
}

onMounted(() => {
  store.startPolling()
  store.fetchNotifications(1)
})

onUnmounted(() => {
  store.stopPolling()
})
</script>

<template>
  <Menu v-slot="{ open }" as="div" class="relative">
    <MenuButton
      class="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
    >
      <BellIcon class="w-5 h-5" />
      <span
        v-if="store.unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900"
      >
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
      <!-- Pulse animation when there are unread notifications -->
      <span
        v-if="store.unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-indigo-600 animate-ping opacity-20"
      />
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
        class="absolute right-0 mt-2 w-96 origin-top-right rounded-xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none overflow-hidden z-50"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <span
              v-if="store.unreadCount > 0"
              class="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium"
            >
              {{ store.unreadCount }}
            </span>
          </div>
          <button
            v-if="store.unreadCount > 0"
            @click.stop="store.markAllAsRead"
            class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
          >
            Mark all read
          </button>
        </div>

        <!-- Notification list -->
        <div class="max-h-96 overflow-y-auto">
          <div
            v-if="store.notifications.length === 0"
            class="px-4 py-12 text-center"
          >
            <BellIcon class="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p class="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
          </div>
          <MenuItem
            v-for="n in store.notifications"
            :key="n.id"
            v-slot="{ active }"
          >
            <button
              @click="handleClick(n)"
              :class="[
                active ? 'bg-gray-50 dark:bg-gray-800/50' : '',
                !n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : '',
                'w-full px-4 py-3 text-left flex gap-3 transition-colors border-b border-gray-100 dark:border-gray-800/50 last:border-0',
              ]"
            >
              <div
                :class="[
                  'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                  typeColors[n.type],
                ]"
              >
                <component :is="typeIcons[n.type]" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ n.title }}</p>
                  <span
                    v-if="!n.isRead"
                    class="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-600"
                  />
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{{ n.message }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ store.formatTime(n.createdAt) }}</p>
              </div>
            </button>
          </MenuItem>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <router-link
            to="/notifications"
            class="block text-center text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            View all notifications
          </router-link>
        </div>
      </MenuItems>
    </Transition>
  </Menu>
</template>
