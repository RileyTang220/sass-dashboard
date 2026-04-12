<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { TaskPriority, TaskStatus, TaskType } from '@/types'
import DataTable from '@/components/common/DataTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useDataStore } from '@/stores/dataStore'
import { useToast } from '@/composables/useToast'
import {
  RectangleStackIcon,
  ClockIcon,
  CheckBadgeIcon,
  FireIcon,
} from '@heroicons/vue/24/outline'

const store = useDataStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const isCreateModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const taskIdToDelete = ref<string | null>(null)

const filters = reactive({
  projectId: (route.query.projectId as string) ?? 'all',
  status: 'all',
  assigneeId: 'all',
  priority: 'all',
})

const taskForm = reactive({
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  priority: 'Medium' as TaskPriority,
  type: 'Feature' as TaskType,
  dueDate: '',
})

const columns = [
  { key: 'title', label: 'Task', sortable: true },
  { key: 'project', label: 'Project' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'dueDate', label: 'Due date', sortable: true },
]

const taskStatuses: TaskStatus[] = ['Backlog', 'In Progress', 'In Review', 'Done']
const taskPriorities: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical']
const taskTypes: TaskType[] = ['Feature', 'Bug', 'Ops', 'Research']

const filteredTaskRows = computed(() =>
  store.taskRows.filter((task) => {
    if (filters.projectId !== 'all' && task.projectId !== filters.projectId) return false
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.assigneeId !== 'all' && task.assigneeId !== filters.assigneeId) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    return true
  })
)

const stats = computed(() => [
  {
    title: 'Visible Tasks',
    value: filteredTaskRows.value.length,
    icon: RectangleStackIcon,
    trend: `${filteredTaskRows.value.filter((task) => task.status !== 'Done').length} open`,
    trendUp: true,
  },
  {
    title: 'In Progress',
    value: filteredTaskRows.value.filter((task) => task.status === 'In Progress').length,
    icon: ClockIcon,
    trend: `${filteredTaskRows.value.filter((task) => task.status === 'In Review').length} in review`,
    trendUp: true,
  },
  {
    title: 'Completed',
    value: filteredTaskRows.value.filter((task) => task.status === 'Done').length,
    icon: CheckBadgeIcon,
    trend: `${store.completionRate}% workspace completion`,
    trendUp: true,
  },
  {
    title: 'Critical',
    value: filteredTaskRows.value.filter((task) => task.priority === 'Critical' && task.status !== 'Done').length,
    icon: FireIcon,
    trend: `${filteredTaskRows.value.filter((task) => task.status !== 'Done' && new Date(task.dueDate).getTime() < Date.now()).length} overdue`,
    trendUp: false,
  },
])

const openCreateModal = () => {
  taskForm.title = ''
  taskForm.description = ''
  taskForm.projectId = store.projects[0]?.id ?? ''
  taskForm.assigneeId = store.members[0]?.id ?? ''
  taskForm.priority = 'Medium'
  taskForm.type = 'Feature'
  taskForm.dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  isCreateModalOpen.value = true
}

const submitTask = () => {
  store.addTask({
    title: taskForm.title,
    description: taskForm.description,
    projectId: taskForm.projectId,
    assigneeId: taskForm.assigneeId,
    priority: taskForm.priority,
    type: taskForm.type,
    dueDate: new Date(taskForm.dueDate).toISOString(),
  })
  isCreateModalOpen.value = false
  toast.success('Task created')
}

const updateAssignee = (taskId: string | number | undefined, assigneeId: string) => {
  if (taskId == null) return
  store.updateTaskAssignee(String(taskId), assigneeId)
  toast.success('Assignee updated')
}

const updateProject = (taskId: string | number | undefined, projectId: string) => {
  if (taskId == null) return
  store.updateTaskProject(String(taskId), projectId)
  toast.success('Task moved')
}

const updateStatus = (taskId: string | number | undefined, status: string) => {
  if (taskId == null) return
  store.updateTaskStatus(String(taskId), status as TaskStatus)
  toast.success('Task updated')
}

const openDeleteModal = (id: string | number | undefined) => {
  if (!id) return
  taskIdToDelete.value = String(id)
  isDeleteModalOpen.value = true
}

const confirmDelete = () => {
  if (!taskIdToDelete.value) return
  store.deleteTask(taskIdToDelete.value)
  taskIdToDelete.value = null
  toast.success('Task removed')
}

const clearFilters = () => {
  filters.projectId = 'all'
  filters.status = 'all'
  filters.assigneeId = 'all'
  filters.priority = 'all'
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
      path: '/tasks',
      query: projectId !== 'all' ? { projectId } : {},
    })
  }
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Track delivery work across projects, assignees, and deadlines.</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        <PlusIcon class="h-5 w-5" />
        New Task
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard v-for="stat in stats" :key="stat.title" v-bind="stat" />
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <select v-model="filters.projectId" class="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
          <option value="all">All projects</option>
          <option v-for="project in store.projects" :key="project.id" :value="project.id">{{ project.name }}</option>
        </select>
        <select v-model="filters.status" class="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
          <option value="all">All statuses</option>
          <option v-for="status in taskStatuses" :key="status" :value="status">{{ status }}</option>
        </select>
        <select v-model="filters.assigneeId" class="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
          <option value="all">All assignees</option>
          <option v-for="member in store.members" :key="member.id" :value="member.id">{{ member.name }}</option>
        </select>
        <select v-model="filters.priority" class="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
          <option value="all">All priorities</option>
          <option v-for="priority in taskPriorities" :key="priority" :value="priority">{{ priority }}</option>
        </select>
        <button class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" @click="clearFilters">
          Reset
        </button>
      </div>
    </div>

    <DataTable :columns="columns" :data="filteredTaskRows">
      <template #cell-title="{ item }">
        <div>
          <RouterLink
            :to="`/tasks/${item.id}`"
            class="font-medium text-gray-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
          >
            {{ item.title }}
          </RouterLink>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.type }} · {{ item.description }}</p>
        </div>
      </template>

      <template #cell-project="{ item }">
        <select
          :value="item.projectId"
          class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          @change="updateProject(item.id, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="project in store.projects" :key="project.id" :value="project.id">{{ project.name }}</option>
        </select>
      </template>

      <template #cell-assignee="{ item }">
        <select
          :value="item.assigneeId"
          class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          @change="updateAssignee(item.id, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="member in store.members" :key="member.id" :value="member.id">{{ member.name }}</option>
        </select>
      </template>

      <template #cell-priority="{ item }">
        <span
          class="rounded-full px-2.5 py-1 text-xs font-medium"
          :class="
            item.priority === 'Critical'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
              : item.priority === 'High'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                : item.priority === 'Medium'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          "
        >
          {{ item.priority }}
        </span>
      </template>

      <template #cell-status="{ item }">
        <select
          :value="item.status"
          class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          @change="updateStatus(item.id, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="status in taskStatuses" :key="status" :value="status">{{ status }}</option>
        </select>
      </template>

      <template #cell-dueDate="{ item }">
        {{ format(new Date(item.dueDate), 'MMM d, yyyy') }}
      </template>

      <template #actions-cell="{ item }">
        <button
          @click="openDeleteModal(item.id)"
          class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          title="Delete task"
        >
          <TrashIcon class="h-5 w-5" />
        </button>
      </template>
    </DataTable>

    <BaseModal v-model="isCreateModalOpen" title="Create task">
      <form class="space-y-4" @submit.prevent="submitTask">
        <div>
          <label for="task-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input id="task-title" v-model="taskForm.title" required class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <div>
          <label for="task-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea id="task-description" v-model="taskForm.description" rows="3" class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="task-project" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
            <select id="task-project" v-model="taskForm.projectId" class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
              <option v-for="project in store.projects" :key="project.id" :value="project.id">{{ project.name }}</option>
            </select>
          </div>
          <div>
            <label for="task-assignee" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignee</label>
            <select id="task-assignee" v-model="taskForm.assigneeId" class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
              <option v-for="member in store.members" :key="member.id" :value="member.id">{{ member.name }}</option>
            </select>
          </div>
          <div>
            <label for="task-priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
            <select id="task-priority" v-model="taskForm.priority" class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
              <option v-for="priority in taskPriorities" :key="priority" :value="priority">{{ priority }}</option>
            </select>
          </div>
          <div>
            <label for="task-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <select id="task-type" v-model="taskForm.type" class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
              <option v-for="type in taskTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
        </div>
        <div>
          <label for="task-due-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Due date</label>
          <input id="task-due-date" v-model="taskForm.dueDate" type="date" required class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" @click="isCreateModalOpen = false">Cancel</button>
          <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create task</button>
        </div>
      </form>
    </BaseModal>

    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Delete task"
      message="This permanently removes the task from the workspace."
      @confirm="confirmDelete"
    />
  </div>
</template>
