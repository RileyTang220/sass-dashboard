<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import type { TaskStatus } from '@/types'
import { useDataStore } from '@/stores/dataStore'
import { useToast } from '@/composables/useToast'

const store = useDataStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const filters = reactive({
  projectId: (route.query.projectId as string) ?? 'all',
})

const columns: TaskStatus[] = ['Backlog', 'In Progress', 'In Review', 'Done']

const visibleTasks = computed(() =>
  store.taskRows.filter((task) => filters.projectId === 'all' || task.projectId === filters.projectId)
)

const columnTasks = computed(() =>
  columns.map((status) => ({
    status,
    tasks: visibleTasks.value.filter((task) => task.status === status),
  }))
)

const moveTask = (taskId: string, direction: -1 | 1) => {
  if (!store.canEditTask(taskId)) {
    toast.error('You do not have permission to move this task')
    return
  }
  const task = store.getTaskById(taskId)
  if (!task) return
  const currentIndex = columns.indexOf(task.status)
  const nextIndex = currentIndex + direction
  if (nextIndex < 0 || nextIndex >= columns.length) return
  const nextStatus = columns[nextIndex]
  if (!nextStatus) return
  store.updateTaskStatus(taskId, nextStatus)
  toast.success('Task moved')
}

watch(
  () => route.query.projectId,
  (projectId) => {
    filters.projectId = typeof projectId === 'string' ? projectId : 'all'
  }
)

watch(
  () => filters.projectId,
  (projectId) => {
    router.replace({
      path: '/board',
      query: projectId !== 'all' ? { projectId } : {},
    })
  }
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Board</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Move tasks through the delivery flow by project and current status.</p>
      </div>
      <select v-model="filters.projectId" class="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
        <option value="all">All projects</option>
        <option v-for="project in store.projects" :key="project.id" :value="project.id">{{ project.name }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 gap-5 xl:grid-cols-4">
      <section
        v-for="column in columnTasks"
        :key="column.status"
        class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{{ column.status }}</h3>
          <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {{ column.tasks.length }}
          </span>
        </div>

        <div class="space-y-3">
          <article
            v-for="task in column.tasks"
            :key="task.id"
            class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
          >
            <div class="flex items-start justify-between gap-3">
              <RouterLink
                :to="`/tasks/${task.id}`"
                class="font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
              >
                {{ task.title }}
              </RouterLink>
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                :class="
                  task.priority === 'Critical'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                    : task.priority === 'High'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                "
              >
                {{ task.priority }}
              </span>
            </div>

            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ task.project?.name ?? 'Unknown project' }}</p>
            <p class="mt-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{{ task.description }}</p>

            <div class="mt-4 flex items-center justify-between text-xs text-gray-400">
              <span>{{ task.assignee?.name ?? 'Unassigned' }}</span>
              <span>{{ new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}</span>
            </div>

            <div class="mt-4 flex gap-2">
              <button
                class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
                :disabled="column.status === 'Backlog' || !store.canEditTask(task.id)"
                @click="moveTask(task.id, -1)"
              >
                Move left
              </button>
              <button
                class="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
                :disabled="column.status === 'Done' || !store.canEditTask(task.id)"
                @click="moveTask(task.id, 1)"
              >
                Move right
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
