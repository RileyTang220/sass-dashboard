<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import type { WorkspaceRole } from '@/types'
import DataTable from '@/components/common/DataTable.vue'
import { useDataStore } from '@/stores/dataStore'
import { useToast } from '@/composables/useToast'

const store = useDataStore()
const toast = useToast()

const columns = [
  { key: 'name', label: 'Member', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'projectCount', label: 'Projects', sortable: true },
  { key: 'openTaskCount', label: 'Open tasks', sortable: true },
  { key: 'lastActiveAt', label: 'Last active', sortable: true },
]

const roles: WorkspaceRole[] = ['Owner', 'Admin', 'Member', 'Guest']

const handleRoleChange = (memberId: string | number | undefined, role: string) => {
  if (memberId == null) return
  try {
    store.updateMemberRole(String(memberId), role as WorkspaceRole)
    toast.success('Member role updated')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Role update failed')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Members</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Review team capacity, workspace access, and current workload.</p>
    </div>

    <DataTable :columns="columns" :data="store.memberRows">
      <template #cell-name="{ item }">
        <div class="flex items-center gap-3">
          <img :src="item.avatar" :alt="item.name" class="h-9 w-9 rounded-full" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.email }}</p>
          </div>
        </div>
      </template>

      <template #cell-role="{ item }">
        <select
          :value="item.role"
          class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          :disabled="!store.canManageMembers || (store.currentRole === 'Admin' && (item.role === 'Owner' || item.role === 'Admin'))"
          @change="handleRoleChange(item.id, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
        </select>
      </template>

      <template #cell-status="{ item }">
        <span
          class="rounded-full px-2.5 py-1 text-xs font-medium"
          :class="
            item.status === 'Active'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          "
        >
          {{ item.status }}
        </span>
      </template>

      <template #cell-lastActiveAt="{ item }">
        {{ formatDistanceToNow(new Date(item.lastActiveAt), { addSuffix: true }) }}
      </template>
    </DataTable>
  </div>
</template>
