<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useDataStore } from '@/stores/dataStore'
import { useToast } from '@/composables/useToast'

const store = useDataStore()
const toast = useToast()

const isCreateModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const projectIdToDelete = ref<string | null>(null)

const projectForm = reactive({
  name: '',
  key: '',
  description: '',
  ownerId: '',
  dueDate: '',
})

const columns = [
  { key: 'name', label: 'Project', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'progress', label: 'Progress', sortable: true },
  { key: 'owner', label: 'Owner' },
  { key: 'dueDate', label: 'Due date', sortable: true },
]

const ownerOptions = computed(() => store.members)

const openCreateModal = () => {
  projectForm.name = ''
  projectForm.key = ''
  projectForm.description = ''
  projectForm.ownerId = ownerOptions.value[0]?.id ?? ''
  projectForm.dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  isCreateModalOpen.value = true
}

const submitProject = () => {
  store.addProject({
    name: projectForm.name,
    key: projectForm.key,
    description: projectForm.description,
    ownerId: projectForm.ownerId,
    dueDate: new Date(projectForm.dueDate).toISOString(),
  })
  isCreateModalOpen.value = false
  toast.success('Project created')
}

const openDeleteModal = (id: string | number | undefined) => {
  if (!id) return
  projectIdToDelete.value = String(id)
  isDeleteModalOpen.value = true
}

const confirmDelete = () => {
  if (!projectIdToDelete.value) return
  store.deleteProject(projectIdToDelete.value)
  projectIdToDelete.value = null
  toast.success('Project removed')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage workspace initiatives, ownership, and delivery status.</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        <PlusIcon class="h-5 w-5" />
        New Project
      </button>
    </div>

    <DataTable :columns="columns" :data="store.projectRows">
      <template #cell-name="{ item }">
        <div>
          <RouterLink
            :to="`/projects/${item.id}`"
            class="font-medium text-gray-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
          >
            {{ item.name }}
          </RouterLink>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.key }} · {{ item.description }}</p>
        </div>
      </template>

      <template #cell-status="{ item }">
        <span
          class="rounded-full px-2.5 py-1 text-xs font-medium"
          :class="
            item.status === 'On Track'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : item.status === 'At Risk'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                : item.status === 'Off Track'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
          "
        >
          {{ item.status }}
        </span>
      </template>

      <template #cell-progress="{ item }">
        <div class="space-y-2">
          <div class="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <div class="h-2 rounded-full bg-indigo-600" :style="{ width: `${item.progress}%` }" />
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ item.progress }}% · {{ item.completedTaskCount }}/{{ item.taskCount }} tasks complete
          </p>
        </div>
      </template>

      <template #cell-owner="{ item }">
        <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.owner?.name ?? 'Unknown owner' }}</span>
      </template>

      <template #cell-dueDate="{ item }">
        {{ format(new Date(item.dueDate), 'MMM d, yyyy') }}
      </template>

      <template #actions-cell="{ item }">
        <button
          @click="openDeleteModal(item.id)"
          class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          title="Delete project"
        >
          <TrashIcon class="h-5 w-5" />
        </button>
      </template>
    </DataTable>

    <BaseModal v-model="isCreateModalOpen" title="Create project">
      <form class="space-y-4" @submit.prevent="submitProject">
        <div>
          <label for="project-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project name</label>
          <input id="project-name" v-model="projectForm.name" required class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <div>
          <label for="project-key" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project key</label>
          <input id="project-key" v-model="projectForm.key" maxlength="5" required class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm uppercase dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <div>
          <label for="project-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea id="project-description" v-model="projectForm.description" rows="3" class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <div>
          <label for="project-owner" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner</label>
          <select id="project-owner" v-model="projectForm.ownerId" class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option v-for="member in ownerOptions" :key="member.id" :value="member.id">{{ member.name }}</option>
          </select>
        </div>
        <div>
          <label for="project-due-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Target date</label>
          <input id="project-due-date" v-model="projectForm.dueDate" type="date" required class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" @click="isCreateModalOpen = false">Cancel</button>
          <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create project</button>
        </div>
      </form>
    </BaseModal>

    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Delete project"
      message="This removes the project and all tasks attached to it."
      @confirm="confirmDelete"
    />
  </div>
</template>
