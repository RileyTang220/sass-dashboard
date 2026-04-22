<script setup lang="ts">
import { ref, computed } from 'vue'
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
  ...(store.canManageMembers ? [{ key: 'actions', label: '', sortable: false }] : []),
]

const roles: WorkspaceRole[] = ['Owner', 'Admin', 'Member', 'Guest']

// ── Dialog state ──────────────────────────────────
const showAddDialog = ref(false)
const dialogTab = ref<'direct' | 'invite'>('direct')

// Direct add form
const addForm = ref({
  name: '',
  email: '',
  password: '',
  role: 'Member' as WorkspaceRole,
  projectIds: [] as string[],
})

// Invite form
const inviteForm = ref({
  email: '',
  role: 'Member' as WorkspaceRole,
})

const inviteLink = ref('')
const inviteCopied = ref(false)
const isSubmitting = ref(false)

const resetForms = () => {
  addForm.value = { name: '', email: '', password: '', role: 'Member', projectIds: [] }
  inviteForm.value = { email: '', role: 'Member' }
  inviteLink.value = ''
  inviteCopied.value = false
  isSubmitting.value = false
}

const openDialog = () => {
  resetForms()
  showAddDialog.value = true
}

const closeDialog = () => {
  showAddDialog.value = false
  resetForms()
}

// ── Handlers ──────────────────────────────────────
const handleRoleChange = async (memberId: string | number | undefined, role: string) => {
  if (memberId == null) return
  try {
    await store.updateMemberRole(String(memberId), role as WorkspaceRole)
    toast.success('Member role updated')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Role update failed')
  }
}

const handleDirectAdd = async () => {
  if (!addForm.value.name || !addForm.value.email || !addForm.value.password) {
    toast.error('Please fill in name, email and password')
    return
  }
  isSubmitting.value = true
  try {
    await store.addMember({
      name: addForm.value.name,
      email: addForm.value.email,
      password: addForm.value.password,
      role: addForm.value.role,
      projectIds: addForm.value.projectIds.length > 0 ? addForm.value.projectIds : undefined,
    })
    toast.success('Member added successfully')
    closeDialog()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to add member')
  } finally {
    isSubmitting.value = false
  }
}

const handleInvite = async () => {
  if (!inviteForm.value.email) {
    toast.error('Please enter an email address')
    return
  }
  isSubmitting.value = true
  try {
    const result = await store.inviteMember({
      email: inviteForm.value.email,
      role: inviteForm.value.role,
    })
    const base = window.location.origin
    inviteLink.value = `${base}/invite/${result.inviteToken}`
    toast.success('Invite created')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create invite')
  } finally {
    isSubmitting.value = false
  }
}

const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    inviteCopied.value = true
    toast.success('Invite link copied')
    setTimeout(() => { inviteCopied.value = false }, 2000)
  } catch {
    toast.error('Failed to copy link')
  }
}

const handleRemoveMember = async (memberId: string) => {
  if (!confirm('Are you sure you want to remove this member?')) return
  try {
    await store.removeMember(memberId)
    toast.success('Member removed')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to remove member')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Members</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Review team capacity, workspace access, and current workload.</p>
      </div>
      <button
        v-if="store.canManageMembers"
        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        @click="openDialog"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </svg>
        Add Member
      </button>
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
              : item.status === 'Invited'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          "
        >
          {{ item.status }}
        </span>
      </template>

      <template #cell-lastActiveAt="{ item }">
        {{ formatDistanceToNow(new Date(item.lastActiveAt), { addSuffix: true }) }}
      </template>

      <template #cell-actions="{ item }">
        <button
          v-if="store.canManageMembers && item.role !== 'Owner' && item.id !== store.currentMember?.id"
          class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          title="Remove member"
          @click="handleRemoveMember(String(item.id))"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </template>
    </DataTable>

    <!-- Add Member Dialog -->
    <Teleport to="body">
      <div
        v-if="showAddDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="closeDialog"
      >
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add Member</h3>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="closeDialog">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Tab switcher -->
          <div class="mb-5 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              :class="dialogTab === 'direct'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="dialogTab = 'direct'; inviteLink = ''"
            >
              Direct Add
            </button>
            <button
              class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              :class="dialogTab === 'invite'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="dialogTab = 'invite'"
            >
              Invite Link
            </button>
          </div>

          <!-- Direct Add Form -->
          <form v-if="dialogTab === 'direct'" class="space-y-4" @submit.prevent="handleDirectAdd">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                v-model="addForm.name"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                v-model="addForm.email"
                type="email"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                v-model="addForm.password"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Set initial password"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                v-model="addForm.role"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Assign to Projects</label>
              <div class="max-h-32 space-y-2 overflow-y-auto rounded-lg border border-gray-300 p-2 dark:border-gray-700">
                <label
                  v-for="project in store.projects"
                  :key="project.id"
                  class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    :value="project.id"
                    v-model="addForm.projectIds"
                    class="rounded border-gray-300 text-blue-600"
                  />
                  {{ project.name }}
                </label>
                <p v-if="store.projects.length === 0" class="text-xs text-gray-400">No projects yet</p>
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                @click="closeDialog"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Adding...' : 'Add Member' }}
              </button>
            </div>
          </form>

          <!-- Invite Link Form -->
          <form v-else class="space-y-4" @submit.prevent="handleInvite">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                v-model="inviteForm.email"
                type="email"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Enter email to invite"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                v-model="inviteForm.role"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
              </select>
            </div>

            <!-- Invite link result -->
            <div v-if="inviteLink" class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p class="mb-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Invite link generated (valid for 7 days):</p>
              <div class="flex items-center gap-2">
                <input
                  :value="inviteLink"
                  readonly
                  class="flex-1 rounded border border-emerald-300 bg-white px-2 py-1.5 text-xs dark:border-emerald-700 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  class="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  @click="copyInviteLink"
                >
                  {{ inviteCopied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                @click="closeDialog"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Generating...' : 'Generate Invite Link' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
