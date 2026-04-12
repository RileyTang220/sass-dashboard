import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'

export type NotificationType = 'info' | 'success' | 'warning' | 'system'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
  link?: string
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([
    {
      id: '1',
      title: 'Task moved to review',
      message: 'Refactor sidebar navigation is ready for review in Platform Migration.',
      type: 'success',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      link: '/tasks',
    },
    {
      id: '2',
      title: 'Project at risk',
      message: 'Customer Portal has two high-priority tasks due this week.',
      type: 'info',
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      link: '/projects',
    },
    {
      id: '3',
      title: 'Workspace policy update',
      message: 'Review member roles before inviting external collaborators.',
      type: 'warning',
      read: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ])

  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

  const markAsRead = (id: string) => {
    const n = notifications.value.find((x) => x.id === id)
    if (n) n.read = true
  }

  const markAllAsRead = () => {
    notifications.value.forEach((n) => (n.read = true))
  }

  const add = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    notifications.value.unshift({
      ...notification,
      id: Math.random().toString(36).slice(2),
      read: false,
      createdAt: new Date().toISOString(),
    })
  }

  const formatTime = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true })

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    add,
    formatTime,
  }
})
