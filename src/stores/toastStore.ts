import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  createdAt: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  const add = (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, message, type, duration, createdAt: Date.now() }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
  }

  const remove = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const success = (message: string, duration?: number) => add(message, 'success', duration)
  const error = (message: string, duration?: number) => add(message, 'error', duration ?? 6000)
  const info = (message: string, duration?: number) => add(message, 'info', duration)
  const warning = (message: string, duration?: number) => add(message, 'warning', duration)

  return { toasts, add, remove, success, error, info, warning }
})
