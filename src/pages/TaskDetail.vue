<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { format, formatDistanceToNow } from 'date-fns'
import type { TaskStatus } from '@/types'
import { useDataStore } from '@/stores/dataStore'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const store = useDataStore()
const toast = useToast()

const taskId = computed(() => route.params.id as string)
const task = computed(() => store.getTaskById(taskId.value))
const comments = computed(() => store.getTaskComments(taskId.value))
const activity = computed(() => store.getTaskActivity(taskId.value))
const descriptionDraft = ref('')

const commentForm = reactive({
  body: '',
})

const taskStatuses: TaskStatus[] = ['Backlog', 'In Progress', 'In Review', 'Done']
const canEditCurrentTask = computed(() => (task.value ? store.canEditTask(task.value.id) : false))

const updateStatus = (status: string) => {
  if (!task.value) return
  try {
    store.updateTaskStatus(task.value.id, status as TaskStatus)
    toast.success('Task status updated')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Task status update failed')
  }
}

const updateAssignee = (assigneeId: string) => {
  if (!task.value) return
  try {
    store.updateTaskAssignee(task.value.id, assigneeId)
    toast.success('Assignee updated')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Assignee update failed')
  }
}

const updateDescription = () => {
  if (!task.value) return
  try {
    store.updateTaskDescription(task.value.id, descriptionDraft.value)
    toast.success('Description updated')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Description update failed')
  }
}

const addComment = () => {
  if (!task.value || !commentForm.body.trim()) return
  try {
    store.addTaskComment(task.value.id, store.currentMember?.id ?? task.value.assigneeId, commentForm.body.trim())
    commentForm.body = ''
    toast.success('Comment added')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Comment failed')
  }
}

watch(
  task,
  (nextTask) => {
    descriptionDraft.value = nextTask?.description ?? ''
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="task" class="space-y-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-medium text-indigo-600 dark:text-indigo-400">{{ task.project?.key ?? 'TASK' }}</p>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ task.title }}</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ task.project?.name ?? 'Unknown project' }} · Updated {{ formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true }) }}
        </p>
      </div>
      <RouterLink
        :to="task.project ? `/projects/${task.project.id}` : '/projects'"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        Open project
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <section class="space-y-6">
        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Description</h3>
            <button
              :disabled="!canEditCurrentTask"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              @click="updateDescription"
            >
              Save
            </button>
          </div>
          <textarea
            v-model="descriptionDraft"
            :disabled="!canEditCurrentTask"
            rows="8"
            class="mt-4 block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Comments</h3>
          <div class="mt-5 space-y-4">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-800"
            >
              <div class="flex items-center gap-3">
                <img :src="comment.author?.avatar" :alt="comment.author?.name" class="h-9 w-9 rounded-full" />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ comment.author?.name ?? 'Unknown member' }}</p>
                  <p class="text-xs text-gray-400">{{ formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) }}</p>
                </div>
              </div>
              <p class="mt-3 text-sm text-gray-600 dark:text-gray-300">{{ comment.body }}</p>
            </div>
          </div>

          <form class="mt-5 space-y-3" @submit.prevent="addComment">
            <textarea
              v-model="commentForm.body"
              :disabled="!store.canCommentOnTasks"
              rows="4"
              placeholder="Add context, blockers, or review notes..."
              class="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="!store.canCommentOnTasks"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add comment
              </button>
            </div>
          </form>
        </div>
      </section>

      <section class="space-y-6">
        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Task details</h3>
          <div class="mt-5 space-y-4 text-sm">
            <div>
              <label class="mb-1 block text-gray-500 dark:text-gray-400">Status</label>
              <select
                :value="task.status"
                :disabled="!canEditCurrentTask"
                class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                @change="updateStatus(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="status in taskStatuses" :key="status" :value="status">{{ status }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-gray-500 dark:text-gray-400">Assignee</label>
              <select
                :value="task.assigneeId"
                :disabled="!canEditCurrentTask"
                class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                @change="updateAssignee(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="member in store.members" :key="member.id" :value="member.id">{{ member.name }}</option>
              </select>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-gray-500 dark:text-gray-400">Priority</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ task.priority }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-gray-500 dark:text-gray-400">Type</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ task.type }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-gray-500 dark:text-gray-400">Due date</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ format(new Date(task.dueDate), 'MMM d, yyyy') }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-gray-500 dark:text-gray-400">Reporter</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ task.reporter?.name ?? 'Unknown reporter' }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Activity</h3>
          <div class="mt-5 space-y-4">
            <div
              v-for="entry in activity"
              :key="entry.id"
              class="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <img :src="entry.actor?.avatar" :alt="entry.actor?.name" class="h-8 w-8 rounded-full" />
              <div class="min-w-0">
                <p class="text-sm text-gray-900 dark:text-white">
                  <span class="font-medium">{{ entry.actor?.name ?? 'Unknown member' }}</span>
                  {{ entry.message.toLowerCase() }}
                </p>
                <p class="mt-1 text-xs text-gray-400">{{ formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <div v-else class="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Task not found</h2>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">The task may have been deleted or the link is invalid.</p>
    <RouterLink to="/tasks" class="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
      Back to tasks
    </RouterLink>
  </div>
</template>
