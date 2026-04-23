<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  BellIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  BoltIcon,
  CheckCircleIcon,
  TrashIcon,
  CheckIcon,
  FunnelIcon,
} from '@heroicons/vue/24/outline'
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

const typeLabels: Record<NotificationType, string> = {
  TaskAssigned: 'Assignment',
  TaskStatusChanged: 'Status Change',
  TaskCommented: 'Comment',
  SprintStarted: 'Sprint Started',
  SprintCompleted: 'Sprint Completed',
  MemberAdded: 'Member Added',
  MemberRemoved: 'Member Removed',
}

function handleClick(n: Notification) {
  store.markAsRead(n.id)
  if (n.linkUrl) router.push(n.linkUrl)
}

function goToPage(page: number) {
  if (page >= 1 && page <= store.totalPages) {
    store.fetchNotifications(page)
  }
}

const pageNumbers = computed(() => {
  const pages: number[] = []
  const total = store.totalPages
  const current = store.currentPage
  const delta = 2
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    pages.push(i)
  }
  return pages
})

onMounted(() => {
  store.fetchNotifications(1)
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ store.total }} total, {{ store.unreadCount }} unread
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Filter tabs -->
        <div class="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          <button
            @click="store.setFilter('all')"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              store.filter === 'all'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700',
            ]"
          >
            All
          </button>
          <button
            @click="store.setFilter('unread')"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              store.filter === 'unread'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700',
            ]"
          >
            Unread
          </button>
        </div>
        <!-- Mark all read -->
        <button
          v-if="store.unreadCount > 0"
          @click="store.markAllAsRead"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
        >
          <CheckIcon class="w-4 h-4" />
          Mark all read
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="store.loading && store.notifications.length === 0" class="text-center py-16">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="mt-3 text-sm text-gray-500">Loading notifications...</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="store.notifications.length === 0"
      class="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
    >
      <BellIcon class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ store.filter === 'unread' ? 'All caught up!' : 'No notifications yet' }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ store.filter === 'unread'
          ? 'You have no unread notifications.'
          : 'Notifications will appear here when tasks are assigned, updated, or commented on.' }}
      </p>
    </div>

    <!-- Notification list -->
    <div v-else class="space-y-2">
      <div
        v-for="n in store.notifications"
        :key="n.id"
        :class="[
          'group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer',
          n.isRead
            ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30 hover:border-indigo-300',
        ]"
        @click="handleClick(n)"
      >
        <!-- Icon -->
        <div
          :class="[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            typeColors[n.type],
          ]"
        >
          <component :is="typeIcons[n.type]" class="w-5 h-5" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ n.title }}</h4>
            <span
              v-if="!n.isRead"
              class="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-600"
            />
            <span
              class="ml-auto flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
              :class="typeColors[n.type]"
            >
              {{ typeLabels[n.type] }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300">{{ n.message }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{{ store.formatTime(n.createdAt) }}</p>
        </div>

        <!-- Actions -->
        <div class="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            v-if="!n.isRead"
            @click.stop="store.markAsRead(n.id)"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-green-600 transition-colors"
            title="Mark as read"
          >
            <CheckIcon class="w-4 h-4" />
          </button>
          <button
            @click.stop="store.deleteNotification(n.id)"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="store.totalPages > 1"
      class="mt-6 flex items-center justify-center gap-1"
    >
      <button
        @click="goToPage(store.currentPage - 1)"
        :disabled="store.currentPage <= 1"
        class="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <button
        v-for="p in pageNumbers"
        :key="p"
        @click="goToPage(p)"
        :class="[
          'w-9 h-9 text-sm rounded-lg font-medium transition-colors',
          p === store.currentPage
            ? 'bg-indigo-600 text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        ]"
      >
        {{ p }}
      </button>
      <button
        @click="goToPage(store.currentPage + 1)"
        :disabled="store.currentPage >= store.totalPages"
        class="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  </div>
</template>
