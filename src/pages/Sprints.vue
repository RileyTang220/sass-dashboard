<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import type { SprintStatus, TaskStatus } from '@/types'
import { useDataStore } from '@/stores/dataStore'
import { useToast } from '@/composables/useToast'

const store = useDataStore()
const toast = useToast()

// ── State ─────────────────────────────────────────
const activeTab = ref<'board' | 'backlog' | 'all'>('board')
const showCreateDialog = ref(false)
const showCompleteDialog = ref(false)
const isSubmitting = ref(false)

const createForm = ref({
  name: '',
  goal: '',
  endDate: '',
})

const selectedBacklogTasks = ref<string[]>([])

// ── Computed ──────────────────────────────────────
const activeSprint = computed(() => store.activeSprint)

const planningSprints = computed(() =>
  store.sprints.filter((s) => s.status === 'Planning')
)

const completedSprints = computed(() =>
  store.sprints.filter((s) => s.status === 'Completed').slice(0, 5)
)

const sprintBoardTasks = computed(() => {
  if (!activeSprint.value) return { Backlog: [], 'In Progress': [], 'In Review': [], Done: [] }
  const tasks = store.sprintTasks(activeSprint.value.id)
  const grouped: Record<string, typeof tasks> = {
    Backlog: [],
    'In Progress': [],
    'In Review': [],
    Done: [],
  }
  for (const task of tasks) {
    const col = grouped[task.status]
    if (col) col.push(task)
    else grouped.Backlog?.push(task)
  }
  return grouped
})

const sprintProgress = computed(() => {
  if (!activeSprint.value) return 0
  const tasks = store.sprintTasks(activeSprint.value.id)
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status === 'Done').length
  return Math.round((done / tasks.length) * 100)
})

const backlogTaskRows = computed(() =>
  store.backlogTasks.map((task) => ({
    ...task,
    project: store.projects.find((p) => p.id === task.projectId) ?? null,
    assignee: store.members.find((m) => m.id === task.assigneeId) ?? null,
  }))
)

// ── Handlers ──────────────────────────────────────
const handleCreateSprint = async () => {
  if (!createForm.value.name.trim()) {
    toast.error('Please enter a sprint name')
    return
  }
  isSubmitting.value = true
  try {
    await store.createSprint({
      name: createForm.value.name,
      goal: createForm.value.goal || undefined,
      endDate: createForm.value.endDate || undefined,
    })
    toast.success('Sprint created')
    showCreateDialog.value = false
    createForm.value = { name: '', goal: '', endDate: '' }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create sprint')
  } finally {
    isSubmitting.value = false
  }
}

const handleStartSprint = async (sprintId: string) => {
  try {
    await store.startSprint(sprintId)
    toast.success('Sprint started')
    activeTab.value = 'board'
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to start sprint')
  }
}

const handleCompleteSprint = async () => {
  if (!activeSprint.value) return
  try {
    const result = await store.completeSprint(activeSprint.value.id, null)
    toast.success(`Sprint completed. ${result.movedTaskCount} unfinished tasks moved to backlog.`)
    showCompleteDialog.value = false
    activeTab.value = 'backlog'
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to complete sprint')
  }
}

const handleDeleteSprint = async (sprintId: string) => {
  if (!confirm('Delete this sprint? Tasks will be moved back to backlog.')) return
  try {
    await store.deleteSprint(sprintId)
    toast.success('Sprint deleted')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to delete sprint')
  }
}

const handleAddToSprint = async (sprintId: string) => {
  if (selectedBacklogTasks.value.length === 0) {
    toast.error('Select tasks first')
    return
  }
  try {
    await store.addTasksToSprint(sprintId, selectedBacklogTasks.value)
    toast.success(`${selectedBacklogTasks.value.length} tasks added to sprint`)
    selectedBacklogTasks.value = []
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to add tasks')
  }
}

const handleRemoveFromSprint = async (taskId: string) => {
  if (!activeSprint.value) return
  try {
    await store.removeTasksFromSprint(activeSprint.value.id, [taskId])
    toast.success('Task moved to backlog')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to remove task')
  }
}

const handleStatusChange = async (taskId: string, status: string) => {
  try {
    await store.updateTaskStatus(taskId, status as TaskStatus)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to update status')
  }
}

const toggleBacklogTask = (taskId: string) => {
  const idx = selectedBacklogTasks.value.indexOf(taskId)
  if (idx === -1) selectedBacklogTasks.value.push(taskId)
  else selectedBacklogTasks.value.splice(idx, 1)
}

const priorityColor = (p: string) => {
  const map: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  return map[p] ?? map.Medium
}

const statusColumns: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'Backlog', label: 'Backlog', color: 'bg-gray-400' },
  { key: 'In Progress', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'In Review', label: 'In Review', color: 'bg-amber-500' },
  { key: 'Done', label: 'Done', color: 'bg-emerald-500' },
]

// Which sprint to add backlog tasks to
const targetSprintForAdd = computed(() => {
  if (activeSprint.value) return activeSprint.value
  if (planningSprints.value.length > 0) return planningSprints.value[0]
  return null
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Sprints</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Plan and track work in time-boxed iterations.</p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        @click="showCreateDialog = true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </svg>
        New Sprint
      </button>
    </div>

    <!-- Active Sprint Banner -->
    <div v-if="activeSprint" class="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">Active</span>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ activeSprint.name }}</h3>
          </div>
          <p v-if="activeSprint.goal" class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ activeSprint.goal }}</p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {{ activeSprint.taskCount }} tasks · {{ activeSprint.completedTaskCount }} done
            <template v-if="activeSprint.endDate"> · ends {{ formatDistanceToNow(parseISO(activeSprint.endDate), { addSuffix: true }) }}</template>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ sprintProgress }}%</span>
            <div class="mt-1 h-2 w-32 rounded-full bg-blue-200 dark:bg-blue-800">
              <div class="h-2 rounded-full bg-blue-600 transition-all" :style="{ width: `${sprintProgress}%` }"></div>
            </div>
          </div>
          <button
            class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            @click="showCompleteDialog = true"
          >
            Complete Sprint
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      <button
        v-for="tab in [
          { key: 'board', label: 'Sprint Board' },
          { key: 'backlog', label: `Backlog (${store.backlogTasks.length})` },
          { key: 'all', label: 'All Sprints' },
        ]"
        :key="tab.key"
        class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        :class="activeTab === tab.key
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
        @click="activeTab = tab.key as any"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Sprint Board Tab -->
    <div v-if="activeTab === 'board'">
      <div v-if="!activeSprint" class="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <p class="text-gray-500 dark:text-gray-400">No active sprint. Create one and start it to see the board.</p>
      </div>
      <div v-else class="grid grid-cols-4 gap-4">
        <div v-for="col in statusColumns" :key="col.key" class="min-h-[200px]">
          <div class="mb-3 flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full" :class="col.color"></span>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ col.label }}</span>
            <span class="ml-auto text-xs text-gray-400">{{ sprintBoardTasks[col.key]?.length ?? 0 }}</span>
          </div>
          <div class="space-y-2">
            <div
              v-for="task in sprintBoardTasks[col.key]"
              :key="task.id"
              class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <router-link :to="`/tasks/${task.id}`" class="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                {{ task.title }}
              </router-link>
              <div class="mt-2 flex items-center justify-between">
                <span class="rounded px-1.5 py-0.5 text-[10px] font-medium" :class="priorityColor(task.priority)">
                  {{ task.priority }}
                </span>
                <div class="flex items-center gap-1">
                  <select
                    :value="task.status"
                    class="rounded border border-gray-200 bg-transparent px-1 py-0.5 text-[10px] dark:border-gray-700 dark:text-gray-300"
                    @change="handleStatusChange(task.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="s in statusColumns" :key="s.key" :value="s.key">{{ s.label }}</option>
                  </select>
                  <button
                    class="rounded p-0.5 text-gray-400 hover:text-red-500"
                    title="Remove from sprint"
                    @click="handleRemoveFromSprint(task.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Backlog Tab -->
    <div v-if="activeTab === 'backlog'">
      <div v-if="targetSprintForAdd && selectedBacklogTasks.length > 0" class="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
        <span class="text-sm text-blue-700 dark:text-blue-300">{{ selectedBacklogTasks.length }} tasks selected</span>
        <button
          class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          @click="handleAddToSprint(targetSprintForAdd.id)"
        >
          Add to {{ targetSprintForAdd.name }}
        </button>
        <button
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400"
          @click="selectedBacklogTasks = []"
        >
          Clear
        </button>
      </div>

      <div v-if="backlogTaskRows.length === 0" class="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <p class="text-gray-500 dark:text-gray-400">No tasks in backlog. All tasks are either in a sprint or done.</p>
      </div>
      <div v-else class="space-y-1">
        <div
          v-for="task in backlogTaskRows"
          :key="task.id"
          class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          :class="{ 'ring-2 ring-blue-500': selectedBacklogTasks.includes(task.id) }"
        >
          <input
            type="checkbox"
            :checked="selectedBacklogTasks.includes(task.id)"
            class="rounded border-gray-300 text-blue-600"
            @change="toggleBacklogTask(task.id)"
          />
          <div class="min-w-0 flex-1">
            <router-link :to="`/tasks/${task.id}`" class="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white">
              {{ task.title }}
            </router-link>
            <div class="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
              <span v-if="task.project" class="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">{{ task.project.key }}</span>
              <span class="rounded px-1.5 py-0.5" :class="priorityColor(task.priority)">{{ task.priority }}</span>
              <span v-if="task.assignee">{{ task.assignee.name }}</span>
            </div>
          </div>
          <span class="text-xs text-gray-400">{{ task.type }}</span>
        </div>
      </div>
    </div>

    <!-- All Sprints Tab -->
    <div v-if="activeTab === 'all'" class="space-y-4">
      <!-- Planning sprints -->
      <div v-if="planningSprints.length > 0">
        <h3 class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Planning</h3>
        <div class="space-y-2">
          <div
            v-for="sprint in planningSprints"
            :key="sprint.id"
            class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white">{{ sprint.name }}</h4>
              <p v-if="sprint.goal" class="mt-0.5 text-sm text-gray-500">{{ sprint.goal }}</p>
              <p class="mt-0.5 text-xs text-gray-400">{{ sprint.taskCount }} tasks
                <template v-if="sprint.endDate"> · ends {{ format(parseISO(sprint.endDate), 'MMM d, yyyy') }}</template>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                :disabled="!!activeSprint"
                :title="activeSprint ? 'Complete the active sprint first' : 'Start sprint'"
                @click="handleStartSprint(sprint.id)"
              >
                Start Sprint
              </button>
              <button
                class="rounded p-1.5 text-gray-400 hover:text-red-500"
                @click="handleDeleteSprint(sprint.id)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Completed sprints -->
      <div v-if="completedSprints.length > 0">
        <h3 class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completed</h3>
        <div class="space-y-2">
          <div
            v-for="sprint in completedSprints"
            :key="sprint.id"
            class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Completed</span>
                <h4 class="font-medium text-gray-900 dark:text-white">{{ sprint.name }}</h4>
              </div>
              <p class="mt-0.5 text-xs text-gray-400">
                {{ sprint.completedTaskCount }}/{{ sprint.taskCount }} tasks completed
                <template v-if="sprint.endDate"> · {{ format(parseISO(sprint.endDate), 'MMM d, yyyy') }}</template>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="planningSprints.length === 0 && completedSprints.length === 0 && !activeSprint" class="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <p class="text-gray-500 dark:text-gray-400">No sprints yet. Create your first sprint to get started.</p>
      </div>
    </div>

    <!-- Create Sprint Dialog -->
    <Teleport to="body">
      <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showCreateDialog = false">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">New Sprint</h3>
          <form class="space-y-4" @submit.prevent="handleCreateSprint">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                v-model="createForm.name"
                type="text"
                required
                placeholder="e.g. Sprint 1"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Goal (optional)</label>
              <input
                v-model="createForm.goal"
                type="text"
                placeholder="What do you want to achieve?"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date (optional)</label>
              <input
                v-model="createForm.endDate"
                type="date"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                @click="showCreateDialog = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Creating...' : 'Create Sprint' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Complete Sprint Dialog -->
    <Teleport to="body">
      <div v-if="showCompleteDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showCompleteDialog = false">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Complete Sprint</h3>
          <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Unfinished tasks will be moved back to the backlog.
          </p>
          <div v-if="activeSprint" class="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              <strong>{{ activeSprint.completedTaskCount }}</strong> of <strong>{{ activeSprint.taskCount }}</strong> tasks completed
            </p>
          </div>
          <div class="flex justify-end gap-3">
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              @click="showCompleteDialog = false"
            >
              Cancel
            </button>
            <button
              class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              @click="handleCompleteSprint"
            >
              Complete Sprint
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
