<script setup lang="ts">
import { ref, computed, toRef } from 'vue'; 
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline';

// Define what a Column looks like
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

const props = defineProps<{
  columns: Column[];
  data: any[];
}>();


const dataRef = toRef(props, 'data');

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');


const filteredData = computed(() => {
  let result = [...dataRef.value]; 


  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
  }

  // 2. Sort
  if (sortKey.value) {
    result.sort((a, b) => {
      const valA = a[sortKey.value];
      const valB = b[sortKey.value];
      if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return result;
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredData.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage));

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
    <!-- Header / Toolbar -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between gap-4">
      <div class="relative max-w-xs w-full">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search..." 
          class="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
        />
      </div>
      <slot name="actions" />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
        <thead class="bg-gray-50 dark:bg-gray-800/50 uppercase font-semibold text-xs text-gray-700 dark:text-gray-300">
          <tr>
            <th 
              v-for="col in columns" 
              :key="col.key"
              @click="col.sortable && sortBy(col.key)"
              :class="['px-6 py-4', col.sortable ? 'cursor-pointer hover:text-indigo-600 select-none' : '']"
            >
              <div class="flex items-center gap-1">
                {{ col.label }}
                <span v-if="sortKey === col.key" class="text-indigo-500">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </th>
            <th class="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
          
          <tr v-if="paginatedData.length === 0">
            <td :colspan="columns.length + 1" class="px-6 py-4 text-center text-gray-400">
              No data found.
            </td>
          </tr>

          <template v-else>
            <tr v-for="item in paginatedData" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td v-for="col in columns" :key="col.key" class="px-6 py-4">
                <slot :name="`cell-${col.key}`" :item="item">
                  {{ item[col.key] }}
                </slot>
              </td>
              <td class="px-6 py-4 text-right">
                <slot name="actions-cell" :item="item" />
              </td>
            </tr>
          </template>

        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
      <span class="text-xs text-gray-500">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <div class="flex gap-2">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </button>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>