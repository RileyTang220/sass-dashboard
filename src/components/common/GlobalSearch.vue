<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Dialog,
  DialogPanel,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue'
import {
  MagnifyingGlassIcon,
  UserIcon,
  DocumentTextIcon,
  HomeIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline'
import { useDataStore } from '@/stores/dataStore'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const router = useRouter()
const dataStore = useDataStore()

const query = ref('')
const selectedIndex = ref(0)

type SearchResult = {
  type: 'user' | 'sale' | 'nav'
  id?: string
  title: string
  subtitle?: string
  path: string
  icon: typeof HomeIcon
}

const searchResults = computed<SearchResult[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) {
    return [
      { type: 'nav', title: 'Dashboard', path: '/', icon: HomeIcon },
      { type: 'nav', title: 'Users', path: '/users', icon: UserIcon },
      { type: 'nav', title: 'Sales', path: '/sales', icon: DocumentTextIcon },
      { type: 'nav', title: 'Analytics', path: '/analytics', icon: ChartBarIcon },
    ]
  }

  const results: SearchResult[] = []

  dataStore.users.forEach((u) => {
    if (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    ) {
      results.push({
        type: 'user',
        id: u.id,
        title: u.name,
        subtitle: u.email,
        path: '/users',
        icon: UserIcon,
      })
    }
  })

  dataStore.sales.forEach((s) => {
    if (
      s.customerName.toLowerCase().includes(q) ||
      s.productName.toLowerCase().includes(q)
    ) {
      results.push({
        type: 'sale',
        id: s.id,
        title: s.customerName,
        subtitle: `${s.productName} - $${s.amount}`,
        path: '/sales',
        icon: DocumentTextIcon,
      })
    }
  })

  const navItems = [
    { title: 'Dashboard', path: '/', icon: HomeIcon },
    { title: 'Users', path: '/users', icon: UserIcon },
    { title: 'Sales', path: '/sales', icon: DocumentTextIcon },
    { title: 'Analytics', path: '/analytics', icon: ChartBarIcon },
  ]

  navItems.forEach((item) => {
    if (item.title.toLowerCase().includes(q)) {
      results.push({ type: 'nav', ...item })
    }
  })

  return results.slice(0, 8)
})

const visibleResults = computed(() => searchResults.value)

watch(visibleResults, () => {
  selectedIndex.value = 0
})

const selectResult = (result: SearchResult) => {
  emit('update:modelValue', false)
  router.push(result.path)
  query.value = ''
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, visibleResults.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    const result = visibleResults.value[selectedIndex.value]
    if (result) {
      e.preventDefault()
      selectResult(result)
    }
  }
}

const handleKey = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    emit('update:modelValue', !props.modelValue)
  }
  if (e.key === 'Escape') {
    emit('update:modelValue', false)
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      query.value = ''
      selectedIndex.value = 0
      setTimeout(() => {
        const input = document.querySelector('#global-search-input') as HTMLInputElement
        input?.focus()
      }, 50)
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <TransitionRoot appear :show="modelValue" as="template">
    <Dialog as="div" class="relative z-[200]" @close="emit('update:modelValue', false)">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-start justify-center pt-[20vh] px-4">
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all"
            >
              <div class="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-800">
                <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  id="global-search-input"
                  v-model="query"
                  type="text"
                  placeholder="Search users, sales, pages..."
                  class="flex-1 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  @keydown="handleKeydown"
                />
                <kbd class="hidden sm:inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs text-gray-500">
                  ESC
                </kbd>
              </div>

              <div class="max-h-80 overflow-y-auto py-2">
                <div
                  v-if="visibleResults.length === 0"
                  class="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No results found
                </div>
                <button
                  v-for="(result, idx) in visibleResults"
                  :key="`${result.type}-${result.id ?? result.path}-${idx}`"
                  @click="selectResult(result)"
                  :class="[
                    selectedIndex === idx
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  ]"
                >
                  <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <component :is="result.icon" class="w-4 h-4 text-gray-500" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">{{ result.title }}</p>
                    <p v-if="result.subtitle" class="text-xs text-gray-500 truncate">{{ result.subtitle }}</p>
                  </div>
                  <ArrowRightIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              </div>

              <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                <span><kbd class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">↑</kbd> <kbd class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">↓</kbd> to navigate, <kbd class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">Enter</kbd> to open</span>
                <span><kbd class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">⌘K</kbd> to open search</span>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
