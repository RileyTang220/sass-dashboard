<script setup lang="ts">
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/solid';
import type { FunctionalComponent } from 'vue';

defineProps<{
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: FunctionalComponent;
}>();
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ value }}</p>
      </div>
      <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <component :is="icon" class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
    </div>
    
    <div v-if="trend" class="mt-4 flex items-center text-sm">
      <span 
        :class="[
          trendUp ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20',
          'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1'
        ]"
      >
        <ArrowUpIcon v-if="trendUp" class="w-3 h-3" />
        <ArrowDownIcon v-else class="w-3 h-3" />
        {{ trend }}
      </span>
      <span class="text-gray-400 ml-2 text-xs">vs last month</span>
    </div>
  </div>
</template>