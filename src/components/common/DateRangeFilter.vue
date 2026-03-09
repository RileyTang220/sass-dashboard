<script setup lang="ts">
import { useDataStore } from '@/stores/dataStore';
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
import type { DateRange } from '@/types';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';

const store = useDataStore();

const presets: DateRange[] = [
  { label: 'Last 7 Days', start: subDays(new Date(), 7), end: new Date() },
  { label: 'Last 30 Days', start: subDays(new Date(), 30), end: new Date() },
  { label: 'Last 90 Days', start: subDays(new Date(), 90), end: new Date() },
  { label: 'Last 12 Months', start: subMonths(new Date(), 12), end: new Date() },
  { label: 'This Month', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
  { label: 'Last Month', start: startOfMonth(subDays(new Date(), 30)), end: endOfMonth(subDays(new Date(), 30)) },
];

const updateFilter = (preset: DateRange) => {
  store.setDateRange(preset.start, preset.end, preset.label);
};
</script>

<template>
  <!-- 
    Replace the <select> with a custom Headless UI Menu 
  -->
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white">
        <CalendarIcon class="w-5 h-5 text-gray-400" />
        <span>{{ store.dateRange.label }}</span>
        <ChevronDownIcon class="w-4 h-4 text-gray-400" />
      </MenuButton>
    </div>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems class="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div class="px-1 py-1">
          <MenuItem 
            v-for="preset in presets" 
            :key="preset.label" 
            v-slot="{ active }"
          >
            <button
              @click="updateFilter(preset)"
              :class="[
                active ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-gray-200',
                store.dateRange.label === preset.label ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : '',
                'group flex w-full items-center rounded-md px-2 py-2 text-sm'
              ]"
            >
              {{ preset.label }}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>