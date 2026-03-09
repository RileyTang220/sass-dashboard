<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { useToast } from '@/composables/useToast';
import DataTable from '@/components/common/DataTable.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/vue/24/outline';
import type { User } from '@/types';

const store = useDataStore();
const toast = useToast();

// Edit/Add Modal State
const isFormModalOpen = ref(false);
const isEditMode = ref(false);
const userToEdit = ref<User | null>(null);


const isDeleteModalOpen = ref(false);
const userIdToDelete = ref<string | null>(null);

const userForm = reactive({
  name: '',
  email: '',
  role: 'Viewer' as 'Admin' | 'Editor' | 'Viewer',
  status: 'Active' as 'Active' | 'Inactive',
});

const columns = [
  { key: 'name', label: 'User', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'joinedDate', label: 'Joined', sortable: true },
];

//Modal Functions
const openAddModal = () => {
  isEditMode.value = false;
  userToEdit.value = null;
  userForm.name = '';
  userForm.email = '';
  userForm.role = 'Viewer';
  userForm.status = 'Active';
  isFormModalOpen.value = true;
};

const openEditModal = (user: User) => {
  isEditMode.value = true;
  userToEdit.value = user;
  userForm.name = user.name;
  userForm.email = user.email;
  userForm.role = user.role;
  userForm.status = user.status;
  isFormModalOpen.value = true;
};

const handleSubmitUser = async () => {
  try {
    if (isEditMode.value && userToEdit.value) {
      await store.updateUser({
        ...userToEdit.value,
        ...userForm,
      });
      toast.success('User updated');
    } else {
      await store.addUser({
        ...userForm,
        avatar: `https://ui-avatars.com/api/?name=${userForm.name.replace(' ', '+')}&background=random`,
      });
      toast.success('User added');
    }
    isFormModalOpen.value = false;
  } catch {
    toast.error('Request failed');
  }
};

// --- Delete Functions ---
const openDeleteModal = (id: string) => {
  userIdToDelete.value = id;
  isDeleteModalOpen.value = true;
};

const confirmDelete = async () => {
  if (!userIdToDelete.value) return;
  try {
    await store.deleteUser(userIdToDelete.value);
    toast.success('User deleted');
  } catch {
    toast.error('Request failed');
  }
  isDeleteModalOpen.value = false;
  userIdToDelete.value = null;
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage your team members and their account permissions.</p>
      </div>
      <button 
        @click="openAddModal"
        class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <PlusIcon class="w-5 h-5" />
        Add User
      </button>
    </div>

    <!-- The Reusable Table -->
    <DataTable :columns="columns" :data="store.users">
      
      <template #cell-name="{ item }">
        <div class="flex items-center gap-3">
          <img :src="item.avatar" alt="" class="w-8 h-8 rounded-full bg-gray-200" />
          <div class="flex flex-col">
            <span class="font-medium text-gray-900 dark:text-white">{{ item.name }}</span>
            <span class="text-xs text-gray-500">{{ item.email }}</span>
          </div>
        </div>
      </template>
      <template #cell-status="{ item }">
        <span 
          :class="[
            item.status === 'Active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
            'px-2 py-1 rounded-full text-xs font-medium'
          ]"
        >
          {{ item.status }}
        </span>
      </template>
      <template #cell-joinedDate="{ item }">
        {{ format(new Date(item.joinedDate), 'MMM dd, yyyy') }}
      </template>

      <!-- Actions Cell -->
      <template #actions-cell="{ item }">
        <div class="flex gap-1">
          <button 
            @click="openEditModal(item)"
            class="p-2 hover:bg-gray-100 text-gray-400 hover:text-blue-600 rounded-lg transition-colors dark:hover:bg-gray-800"
            title="Edit User"
          >
            <PencilIcon class="w-5 h-5" />
          </button>
          <button 
            @click="openDeleteModal(item.id)"
            class="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors dark:hover:bg-red-900/20"
            title="Delete User"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Add/Edit User Modal -->
    <BaseModal v-model="isFormModalOpen" :title="isEditMode ? 'Edit User' : 'Add New User'">
      <form @submit.prevent="handleSubmitUser" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input 
            v-model="userForm.name"
            type="text" 
            id="name" 
            required
            class="mt-1 block w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          />
        </div>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input 
            v-model="userForm.email"
            type="email" 
            id="email" 
            required
            class="mt-1 block w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          />
        </div>
        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
          <select 
            v-model="userForm.role"
            id="role"
            class="mt-1 block w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          >
            <option>Viewer</option>
            <option>Editor</option>
            <option>Admin</option>
          </select>
        </div>
        <div v-if="isEditMode">
          <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select 
            v-model="userForm.status"
            id="status"
            class="mt-1 block w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div class="pt-4 flex justify-end gap-3">
          <button 
            type="button" 
            @click="isFormModalOpen = false"
            class="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-300"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {{ isEditMode ? 'Save Changes' : 'Add User' }}
          </button>
        </div>
      </form>
    </BaseModal>


    <ConfirmModal 
      v-if="isDeleteModalOpen"
      v-model="isDeleteModalOpen"
      title="Delete User"
      message="Are you sure you want to delete this user? This action cannot be undone."
      @confirm="confirmDelete"
    />
  </div>
</template>