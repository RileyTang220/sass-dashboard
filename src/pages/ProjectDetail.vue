<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { format, formatDistanceToNow } from 'date-fns'
import { FolderIcon, RectangleStackIcon, UserGroupIcon, ClockIcon } from '@heroicons/vue/24/outline'
import StatCard from '@/components/common/StatCard.vue'
import { useDataStore } from '@/stores/dataStore'

const route = useRoute()
const store = useDataStore()

const projectId = computed(() => route.params.id as string)
const project = computed(() => store.getProjectById(projectId.value))
const projectTasks = computed(() => store.getProjectTasks(projectId.value))
const projectMembers = computed(() => store.getProjectMembers(projectId.value))

const stats = computed(() => {
  const tasks = projectTasks.value
  const openTasks = tasks.filter((task) => task.status !== 'Done').length
  const doneTasks = tasks.filter((task) => task.status === 'Done').length
  const reviewTasks = tasks.filter((task) => task.status === 'In Review').length

  return [
    { title: 'Progress', value: `${project.value?.progress ?? 0}%`, icon: FolderIcon, trend: `${doneTasks}/${tasks.length || 0} done`, trendUp: true },
    { title: 'Open Tasks', value: openTasks, icon: RectangleStackIcon, trend: `${reviewTasks} in review`, trendUp: true },
    { title: 'Members', value: projectMembers.value.length, icon: UserGroupIcon, trend: `${project.value?.status ?? 'On Track'}`, trendUp: project.value?.status === 'On Track' || project.value?.status === 'Completed' },
    { title: 'Due Date', value: project.value ? format(new Date(project.value.dueDate), 'MMM d') : '--', icon: ClockIcon, trend: project.value ? formatDistanceToNow(new Date(project.value.dueDate), { addSuffix: true }) : undefined, trendUp: false },
  ]
})
</script>

<template>
  <div v-if="project" class="space-y-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-medium text-indigo-600 dark:text-indigo-400">{{ project.key }}</p>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ project.name }}</h2>
        <p class="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{{ project.description }}</p>
      </div>
      <RouterLink
        :to="{ path: '/tasks', query: { projectId: project.id } }"
        class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        View project tasks
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard v-for="stat in stats" :key="stat.title" v-bind="stat" />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
      <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Task breakdown</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Current work across the project lifecycle.</p>
          </div>
          <span
            class="rounded-full px-3 py-1 text-xs font-medium"
            :class="
              project.status === 'On Track'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                : project.status === 'At Risk'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                  : project.status === 'Off Track'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
            "
          >
            {{ project.status }}
          </span>
        </div>

        <div class="mt-6 space-y-4">
          <div
            v-for="task in projectTasks"
            :key="task.id"
            class="rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-800"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <RouterLink
                  :to="`/tasks/${task.id}`"
                  class="font-medium text-gray-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                >
                  {{ task.title }}
                </RouterLink>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ task.description }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">{{ task.type }}</span>
                <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">{{ task.status }}</span>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{{ task.assignee?.name ?? 'Unassigned' }}</span>
              <span>{{ task.priority }}</span>
              <span>Due {{ format(new Date(task.dueDate), 'MMM d, yyyy') }}</span>
            </div>
          </div>
        </div>
      </section>

      <div class="space-y-6">
        <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Project details</h3>
          <div class="mt-5 space-y-4 text-sm">
            <div class="flex items-center justify-between gap-4">
              <span class="text-gray-500 dark:text-gray-400">Owner</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ project.owner?.name ?? 'Unknown owner' }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-gray-500 dark:text-gray-400">Due date</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ format(new Date(project.dueDate), 'MMM d, yyyy') }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-gray-500 dark:text-gray-400">Last updated</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true }) }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-gray-500 dark:text-gray-400">Members</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ projectMembers.length }}</span>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Assigned members</h3>
          <div class="mt-5 space-y-3">
            <div
              v-for="member in projectMembers"
              :key="member.id"
              class="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-800"
            >
              <img :src="member.avatar" :alt="member.name" class="h-10 w-10 rounded-full" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ member.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ member.role }}</p>
              </div>
              <span class="text-xs text-gray-400">{{ formatDistanceToNow(new Date(member.lastActiveAt), { addSuffix: true }) }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <div v-else class="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Project not found</h2>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">The project may have been removed or the link is invalid.</p>
    <RouterLink to="/projects" class="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
      Back to projects
    </RouterLink>
  </div>
</template>
