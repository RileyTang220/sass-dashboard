<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import {
  FolderIcon,
  RectangleStackIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline'
import StatCard from '@/components/common/StatCard.vue'
import { useDataStore } from '@/stores/dataStore'

const store = useDataStore()

const stats = computed(() => [
  {
    title: 'Active Projects',
    value: store.activeProjects.length,
    icon: FolderIcon,
    trend: `${store.projectsByStatus['At Risk']} at risk`,
    trendUp: false,
  },
  {
    title: 'Open Tasks',
    value: store.openTasks.length,
    icon: RectangleStackIcon,
    trend: `${store.completionRate}% complete`,
    trendUp: true,
  },
  {
    title: 'Overdue Tasks',
    value: store.overdueTasks.length,
    icon: ExclamationTriangleIcon,
    trend: `${store.tasksByStatus['In Review']} in review`,
    trendUp: false,
  },
  {
    title: 'Team Members',
    value: store.memberRows.length,
    icon: UserGroupIcon,
    trend: `${store.memberRows.filter((member) => member.status === 'Active').length} active`,
    trendUp: true,
  },
])

const statusCards = computed(() => [
  { label: 'On Track', value: store.projectsByStatus['On Track'], tone: 'bg-emerald-500' },
  { label: 'At Risk', value: store.projectsByStatus['At Risk'], tone: 'bg-amber-500' },
  { label: 'Off Track', value: store.projectsByStatus['Off Track'], tone: 'bg-rose-500' },
  { label: 'Completed', value: store.projectsByStatus.Completed, tone: 'bg-indigo-500' },
])
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium text-indigo-600 dark:text-indigo-400">
        {{ store.workspace?.name ?? 'Workspace' }}
      </p>
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Team overview</h2>
      <p class="max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Track delivery, workload, and upcoming deadlines for the current workspace. This first phase focuses on projects, tasks, and members.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatCard v-for="stat in stats" :key="stat.title" v-bind="stat" />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section class="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Delivery health</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Current project status across the workspace.</p>
          </div>
          <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
            {{ store.workspace?.plan ?? 'Team' }} plan
          </span>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in statusCards"
            :key="card.label"
            class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
          >
            <div class="flex items-center gap-3">
              <span class="h-2.5 w-2.5 rounded-full" :class="card.tone" />
              <p class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ card.label }}</p>
            </div>
            <p class="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-8">
          <div class="mb-4 flex items-center justify-between">
            <h4 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent activity</h4>
            <span class="text-xs text-gray-400">Updated in selected range</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="item in store.recentActivity"
              :key="item.id"
              class="flex items-start gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <div class="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.title }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ item.project?.name ?? 'Unknown project' }} · {{ item.assignee?.name ?? 'Unassigned' }} · {{ item.status }}
                </p>
              </div>
              <span class="text-xs text-gray-400">
                {{ formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true }) }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Upcoming deadlines</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Open tasks that need attention soon.</p>

        <div class="mt-6 space-y-3">
          <div
            v-for="task in store.upcomingTasks"
            :key="task.id"
            class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ task.title }}</p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ task.project?.name ?? 'Unknown project' }} · {{ task.assignee?.name ?? 'Unassigned' }}
                </p>
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-xs font-medium"
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
            <p class="mt-3 text-xs text-gray-400">
              Due {{ formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }) }}
            </p>
          </div>
        </div>
      </section>
    </div>

    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Team workload</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Open task distribution across the workspace.</p>
        </div>
      </div>

      <div class="mt-6 space-y-4">
        <div v-for="member in store.memberWorkload.slice(0, 5)" :key="member.id" class="grid gap-3 md:grid-cols-[220px_1fr_80px] md:items-center">
          <div class="flex items-center gap-3">
            <img :src="member.avatar" :alt="member.name" class="h-9 w-9 rounded-full" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ member.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ member.role }}</p>
            </div>
          </div>
          <div class="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              class="h-2 rounded-full bg-indigo-600"
              :style="{ width: `${Math.min(100, member.openTaskCount * 18)}%` }"
            />
          </div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ member.openTaskCount }} open</p>
        </div>
      </div>
    </section>
  </div>
</template>
