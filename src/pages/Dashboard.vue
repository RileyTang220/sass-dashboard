<script setup lang="ts">
import { useDataStore } from '@/stores/dataStore'
import { computed } from 'vue'
import StatCard from '@/components/common/StatCard.vue'
import RevenueChart from '@/components/charts/RevenueChart.vue'
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

const store = useDataStore()

const stats = computed(() => [
  {
    title: 'Total Revenue',
    value: `$${store.totalRevenue.toLocaleString()}`,
    icon: CurrencyDollarIcon,
    trend: '12.5%',
    trendUp: true,
  },
  {
    title: 'Active Users',
    value: store.users.length,
    icon: UserGroupIcon,
    trend: '8.2%',
    trendUp: true,
  },
  {
    title: 'Total Sales',
    value: store.filteredSales.length,
    icon: ShoppingCartIcon,
    trend: '2.1%',
    trendUp: false,
  },
  {
    title: 'Conversion Rate',
    value: '3.2%',
    icon: ArrowTrendingUpIcon,
    trend: '4.3%',
    trendUp: true,
  },
])

const chartRanges = ['This Month', 'Last Month']
const selectedChartRange = computed(() => {
  return store.dateRange.label
})
</script>

<template>
  <div class="space-y-6">
    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard v-for="stat in stats" :key="stat.title" v-bind="stat" />
    </div>

    <!-- Main Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Revenue Chart (Takes up 2 columns) -->
      <div
        class="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>

          <!-- 
            4. THIS IS THE FIX:
            Replaced the <select> with a <Menu> 
          -->
          <Menu as="div" class="relative inline-block text-left">
            <div>
              <MenuButton
                class="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <span>{{ selectedChartRange }}</span>
                <ChevronDownIcon class="w-4 h-4" />
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
              <MenuItems
                class="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div class="px-1 py-1">
                  <!-- Note: This is just a visual. It doesn't change the data. -->
                  <!-- The *global* "Last 30 Days" filter is what controls the chart. -->
                  <MenuItem v-for="range in chartRanges" :key="range" v-slot="{ active }">
                    <button
                      :class="[
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-gray-200',
                        'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                      ]"
                    >
                      {{ range }}
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
          <!-- End of FIX -->
        </div>
        <RevenueChart :data="store.filteredSales" />
      </div>

      <!-- Recent Activity (Takes up 1 column) -->
      <div
        class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sales</h3>
        <div class="space-y-4">
          <div
            v-for="sale in store.recentSales"
            :key="sale.id"
            class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs"
              >
                {{ sale.customerName.charAt(0) }}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ sale.customerName }}
                </p>
                <p class="text-xs text-gray-500">{{ sale.productName }}</p>
              </div>
            </div>
            <span class="text-sm font-semibold text-green-600">+${{ sale.amount }}</span>
          </div>
        </div>
        <button
          class="w-full mt-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
        >
          View All Transactions
        </button>
      </div>
    </div>
  </div>
</template>