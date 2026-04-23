import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { api } from '@/api/client'
import type { Notification } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const total = ref(0)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const loading = ref(false)
  const filter = ref<'all' | 'unread'>('all')

  let pollTimer: ReturnType<typeof setInterval> | null = null

  // Fetch notifications list
  async function fetchNotifications(page = 1) {
    loading.value = true
    try {
      const filterParam = filter.value === 'unread' ? 'unread' : undefined
      const data = await api.notifications.list(page, 20, filterParam)
      notifications.value = data.notifications
      total.value = data.total
      currentPage.value = data.page
      totalPages.value = data.totalPages
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      loading.value = false
    }
  }

  // Fetch unread count (lightweight, used for polling)
  async function fetchUnreadCount() {
    try {
      const data = await api.notifications.unreadCount()
      unreadCount.value = data.count
    } catch {
      // Silently fail — polling should not break the UI
    }
  }

  // Mark single notification as read
  async function markAsRead(id: string) {
    try {
      await api.notifications.markRead(id)
      const n = notifications.value.find((x) => x.id === id)
      if (n && !n.isRead) {
        n.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all as read
  async function markAllAsRead() {
    try {
      await api.notifications.markAllRead()
      notifications.value.forEach((n) => (n.isRead = true))
      unreadCount.value = 0
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Delete a notification
  async function deleteNotification(id: string) {
    try {
      await api.notifications.delete(id)
      const idx = notifications.value.findIndex((n) => n.id === id)
      if (idx !== -1) {
        const removed = notifications.value.splice(idx, 1)[0]
        if (!removed.isRead) unreadCount.value = Math.max(0, unreadCount.value - 1)
        total.value = Math.max(0, total.value - 1)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // Set filter and reload
  async function setFilter(f: 'all' | 'unread') {
    filter.value = f
    await fetchNotifications(1)
  }

  // Start polling for unread count (every 30 seconds)
  function startPolling() {
    stopPolling()
    fetchUnreadCount()
    pollTimer = setInterval(fetchUnreadCount, 30_000)
  }

  // Stop polling
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  // Format time helper
  function formatTime(date: string) {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  return {
    notifications,
    unreadCount,
    total,
    currentPage,
    totalPages,
    loading,
    filter,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilter,
    startPolling,
    stopPolling,
    formatTime,
  }
})
