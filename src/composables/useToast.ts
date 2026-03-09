import { useToastStore } from '@/stores/toastStore'

export function useToast() {
  const toastStore = useToastStore()
  return {
    success: toastStore.success,
    error: toastStore.error,
    info: toastStore.info,
    warning: toastStore.warning,
  }
}
